/* Engawa MCP client: Streamable HTTP transport for the Xiaowo chat. */
(function () {
  const STORAGE_URL = 'xw_engawaUrl';
  const STORAGE_TOKEN = 'xw_engawaToken';
  let endpoint = localStorage.getItem(STORAGE_URL) || '';
  let token = localStorage.getItem(STORAGE_TOKEN) || '';
  let sessionId = '';
  let sessionInitialized = false;
  let tools = [];
  let connected = false;
  let serverInfo = null;
  let requestId = 0;

  function speakerName() {
    try {
      const name = window.XW?.S?.hisName;
      return (typeof name === 'string' && name.trim()) ? name.trim() : 'TA';
    } catch { return 'TA'; }
  }

  function headers() {
    const value = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    };
    if (sessionId) value['Mcp-Session-Id'] = sessionId;
    if (sessionInitialized) value['MCP-Protocol-Version'] = '2025-03-26';
    if (token) value.Authorization = 'Bearer ' + token;
    return value;
  }

  async function rpc(method, params, notification = false) {
    if (!endpoint) throw new Error('请先填写 Engawa MCP 服务地址');
    const payload = { jsonrpc: '2.0', method };
    if (!notification) payload.id = ++requestId;
    if (params !== undefined) payload.params = params;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload)
    });
    const newSession = response.headers.get('Mcp-Session-Id');
    if (newSession) sessionId = newSession;
    if (notification && (response.status === 202 || response.ok)) return null;
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error('MCP HTTP ' + response.status + (detail ? '：' + detail.slice(0, 220) : ''));
    }
    const raw = await response.text();
    if (!raw.trim()) return null;
    let parsed;
    if ((response.headers.get('content-type') || '').includes('text/event-stream')) {
      const events = raw.split(/\r?\n\r?\n/);
      const data = events.flatMap(event => event.split(/\r?\n/))
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim())
        .filter(Boolean);
      for (const item of data.reverse()) {
        try { parsed = JSON.parse(item); break; } catch {}
      }
    } else {
      try { parsed = JSON.parse(raw); }
      catch { throw new Error('MCP 服务返回了无法识别的数据'); }
    }
    if (!parsed) throw new Error('MCP 服务没有返回 JSON-RPC 响应');
    if (parsed.error) throw new Error(parsed.error.message || 'MCP 请求失败');
    return parsed.result ?? null;
  }

  async function connect(url, accessToken) {
    endpoint = String(url || '').trim();
    token = String(accessToken || '').trim();
    if (!/^https?:\/\//i.test(endpoint)) throw new Error('服务地址需要以 https:// 或 http:// 开头');
    endpoint = endpoint.replace(/\/$/, '');
    sessionId = '';
    sessionInitialized = false;
    connected = false;
    tools = [];
    localStorage.setItem(STORAGE_URL, endpoint);
    localStorage.setItem(STORAGE_TOKEN, token);
    const initResult = await rpc('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'xiaowo-engawa-client', version: '1.0.0' }
    });
    serverInfo = initResult?.serverInfo || null;
    sessionInitialized = true;
    await rpc('notifications/initialized', undefined, true);
    const listed = await rpc('tools/list', {});
    tools = Array.isArray(listed?.tools) ? listed.tools : [];
    connected = true;
    return { serverInfo, tools };
  }

  async function callTool(name, args) {
    if (!connected) throw new Error('窗廊 MCP 尚未连接');
    if (!tools.some(tool => tool.name === name)) throw new Error('服务端未提供工具：' + name);
    const writeTools = ['shelf_add','shelf_remove','hobby_add','hobby_remove'];
    if (writeTools.includes(name)) {
      const approved = window.confirm(speakerName() + ' 想要修改窗廊的书架或爱好订阅：\n' + name + '\n' + JSON.stringify(args || {}, null, 2) + '\n\n是否允许这次修改？');
      if (!approved) return '用户没有授权这次修改，未执行任何更改。';
    }
    const result = await rpc('tools/call', { name, arguments: args || {} });
    const content = Array.isArray(result?.content)
      ? result.content.map(item => item.text || (item.type === 'image' ? '[图片内容]' : JSON.stringify(item))).join('\n')
      : '';
    const structured = result?.structuredContent;
    const output = structured ? JSON.stringify(structured, null, 2) : content || JSON.stringify(result || {}, null, 2);
    if (result?.isError) throw new Error(output || '窗廊工具执行失败');
    return output;
  }

  function openAITools() {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: String(tool.description || '').slice(0, 4000),
        parameters: tool.inputSchema || { type: 'object', properties: {} }
      }
    }));
  }

  function disconnect() {
    connected = false;
    tools = [];
    sessionId = '';
    sessionInitialized = false;
  }

  window.Engawa = {
    connect,
    callTool,
    openAITools,
    disconnect,
    isConnected: () => connected,
    getStatus: () => ({ connected, endpoint, serverInfo, toolCount: tools.length, toolNames: tools.map(t => t.name) }),
    getSavedSettings: () => ({ endpoint: localStorage.getItem(STORAGE_URL) || '', token: localStorage.getItem(STORAGE_TOKEN) || '' })
  };
})();
