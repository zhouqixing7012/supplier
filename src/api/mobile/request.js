export class MobileApiError extends Error {
  constructor(kind, message, { status, code, cause } = {}) {
    super(message, { cause });
    this.name = 'MobileApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

function buildUrl(base, path, query) {
  if (!base) throw new MobileApiError('config', '未配置当前业务服务的地址');
  if (!/^\/(?!\/)/.test(path) || /[?#\\]/.test(path)) {
    throw new MobileApiError('config', '接口路径格式不正确');
  }
  let url;
  try {
    const origin = globalThis.location?.origin;
    url = new URL(base, origin && origin !== 'null' ? origin : undefined);
  } catch {
    throw new MobileApiError('config', '业务服务地址无效');
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new MobileApiError('config', '业务服务地址必须是无内嵌凭据和参数的 HTTP 地址');
  }
  const prefix = url.pathname.replace(/\/+$/, '');
  url.pathname = prefix + path;
  if (prefix && !url.pathname.startsWith(prefix + '/')) throw new MobileApiError('config', '接口路径超出服务范围');
  for (const [key, value] of Object.entries(query || {})) {
    if (key === 'limitSql') throw new MobileApiError('config', '前端不得传入 limitSql');
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item === undefined || item === null) continue;
      const valid = ['string', 'number', 'boolean', 'bigint'].includes(typeof item);
      if (!valid || typeof item === 'number' && (!Number.isFinite(item) || Number.isInteger(item) && !Number.isSafeInteger(item))) {
        throw new MobileApiError('config', '接口查询参数格式不正确，长整数请使用字符串');
      }
      url.searchParams.append(key, String(item));
    }
  }
  return url;
}

async function readResult(response) {
  let result;
  try { result = await response.json(); }
  catch (cause) {
    if (cause?.name === 'AbortError') throw cause;
    throw new MobileApiError('response', '服务返回了无法读取的响应', { cause });
  }
  if (!result || typeof result.code !== 'number') {
    throw new MobileApiError('response', '服务响应缺少有效的业务结果码');
  }
  if (result.code !== 2000) {
    throw new MobileApiError('business', result.msg || '业务处理失败', { code: result.code });
  }
  return result.data ?? null;
}

export function createMobileRequest({
  services = {},
  credentials = 'same-origin',
  getHeaders,
  fetchImpl = globalThis.fetch,
} = {}) {
  return async function request(service, path, { method = 'GET', query, body, signal, responseType = 'json' } = {}) {
    const url = buildUrl(services[service], path, query);
    if (typeof fetchImpl !== 'function') throw new MobileApiError('config', '当前环境不支持发送网络请求');
    const headers = new Headers(await getHeaders?.(service));
    let payload;
    if (body !== undefined) {
      headers.set('Content-Type', 'application/json');
      try { payload = JSON.stringify(body); }
      catch (cause) { throw new MobileApiError('config', '请求体不能转换为 JSON', { cause }); }
    }
    let response;
    try { response = await fetchImpl(url, { method, headers, body: payload, signal, credentials }); }
    catch (cause) {
      if (cause?.name === 'AbortError' || signal?.aborted) throw cause;
      // 返回业务异常时不拼接请求地址，避免把旧接口路径中的令牌带入页面。
      throw new MobileApiError('network', '服务连接失败，请重试');
    }
    if (!response.ok) {
      throw new MobileApiError('http', '服务请求失败（HTTP ' + response.status + '）', { status: response.status });
    }
    if (responseType === 'blob') {
      if (!response.headers.get('Content-Type')?.toLowerCase().includes('json')) return response.blob();
      await readResult(response);
      throw new MobileApiError('response', '服务没有返回文件');
    }
    return readResult(response);
  };
}
