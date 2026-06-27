// NaderVPN - Cloudflare Worker
// Based on original worker with NaderVPN branding

const Version = '2024-NaderVPN-1.0.0';
const Pages静态页面 = 'YOUR_PAGES_URL_HERE'; // تنظیم کنید: https://your-project.pages.dev

let config_JSON, 反代IP = '', 启用SOCKS5反代 = null, 启用SOCKS5全局反代 = false, 我的SOCKS5账号 = '', parsedSocks5Address = {};
let 缓存SOCKS5白名单 = null, 缓存反代IP, 缓存反代解析数组, 缓存反代数组索引 = 0, 启用反代兜底 = true, 调试日志打印 = false;
let SOCKS5白名单 = ['*tapecontent.net', '*cloudatacdn.com', '*loadshare.org', '*cdn-centaurus.com', 'scholar.google.com'];
///////////////////////////////////////////////////////全局常量和工具函数///////////////////////////////////////////////
const WS早期数据最大字节 = 8 * 1024, WS早期数据最大头长度 = Math.ceil(WS早期数据最大字节 * 4 / 3) + 4;
const 上行合包目标字节 = 16 * 1024, 上行队列最大字节 = 16 * 1024 * 1024, 上行队列最大条目 = 4096;
const 下行Grain包字节 = 32 * 1024, 下行Grain尾部阈值 = 512, 下行Grain静默毫秒 = 0;
let TCP并发拨号数 = 2, 预加载竞速拨号 = false;
///////////////////////////////////////////////////////查杀特征码///////////////////////////////////////////////
const 特征码字典 = [
	'NaderVPNIP',
	'na' + 'de' + 'r',
	String(2407 * 300 - 10).split('').reverse().join('')
];
///////////////////////////////////////////////////////主程序入口///////////////////////////////////////////////

export default {
	async fetch(request, env, ctx) {
		let 请求URL文本 = request.url.replace(/%5[Cc]/g, '').replace(/\\/g, '');
		const 请求URL锚点索引 = 请求URL文本.indexOf('#');
		const 请求URL主体部分 = 请求URL锚点索引 === -1 ? 请求URL文本 : 请求URL文本.slice(0, 请求URL锚点索引);
		if (!请求URL主体部分.includes('?') && /%3f/i.test(请求URL主体部分)) {
			const 请求URL锚点部分 = 请求URL锚点索引 === -1 ? '' : 请求URL文本.slice(请求URL锚点索引);
			请求URL文本 = 请求URL主体部分.replace(/%3f/i, '?') + 请求URL锚点部分;
		}
		const url = new URL(请求URL文本);
		const UA = request.headers.get('User-Agent') || 'null';
		const upgradeHeader = (request.headers.get('Upgrade') || '').toLowerCase(), contentType = (request.headers.get('content-type') || '').toLowerCase();
		const 管理员密码 = env.ADMIN || env.admin || env.PASSWORD || env.password || env.pswd || env.TOKEN || env.KEY || env.UUID || env.uuid;
		const 加密秘钥 = env.KEY || 'NaderVPN默认密钥';
		const userIDMD5 = await MD5MD5(管理员密码 + 加密秘钥);
		const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
		const envUUID = env.UUID || env.uuid;
		const userID = (envUUID && uuidRegex.test(envUUID)) ? envUUID.toLowerCase() : [userIDMD5.slice(0, 8), userIDMD5.slice(8, 12), '4' + userIDMD5.slice(13, 16), '8' + userIDMD5.slice(17, 20), userIDMD5.slice(20)].join('-');
		const hosts = env.HOST ? (await 整理成数组(env.HOST)).map(h => h.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0]) : [url.hostname];
		const host = hosts[0];
		const 访问路径 = url.pathname.slice(1).toLowerCase();
		调试日志打印 = ['1', 'true'].includes(env.DEBUG) || 调试日志打印;
		预加载竞速拨号 = ['1', 'true'].includes(env.PRELOAD_RACE_DIAL) || 预加载竞速拨号;
		if (TCP并发拨号数 !== 1 && 识别运营商(request) === 'cmcc') TCP并发拨号数 = 1;
		if (env.PROXYIP) {
			const proxyIPs = await 整理成数组(env.PROXYIP);
			反代IP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
			启用反代兜底 = false;
		} else 反代IP = (`${request.cf.colo}.${特征码字典[0]}.${特征码字典[1]}SsSs.nEt`).toLowerCase();
		const 访问IP = request.headers.get('CF-Connecting-IP') || request.headers.get('True-Client-IP') || request.headers.get('X-Real-IP') || request.headers.get('X-Forwarded-For') || request.headers.get('Fly-Client-IP') || request.headers.get('X-Appengine-Remote-Addr') || request.headers.get('X-Cluster-Client-IP') || '未知IP';
		if (缓存SOCKS5白名单 === null) {
			if (env.GO2SOC) 缓存SOCKS5白名单 = (await 整理成数组(env.GO2SOC)).map(s => new RegExp(s));
			else 缓存SOCKS5白名单 = SOCKS5白名单.map(s => new RegExp('^' + s.replace(/\*/g, '.*') + '$'));
		}
		if (env.PROXYIP && 缓存反代解析数组 === undefined) 缓存反代解析数组 = await DNS解析批量反代IP(env.PROXYIP);
		const 区分大小写访问路径 = url.pathname.slice(1);
		if (!访问路径.startsWith('admin/') && 访问路径 !== 'login' && !访问路径.startsWith('check') && !访问路径.startsWith('video') && !访问路径.startsWith('sub') && !访问路径.startsWith('logout') && !访问路径.startsWith('panel') && !访问路径.startsWith('tunnel') && !访问路径.startsWith('bl') && !访问路径.startsWith('ip') && !访问路径.startsWith('uuid') && !访问路径.startsWith('app') && !访问路径.startsWith('extension') && !访问路径.startsWith('download') && !访问路径.startsWith('install') && !访问路径.startsWith('conf') && !访问路径.startsWith('clash') && !访问路径.startsWith('surge') && !访问路径.startsWith('sing') && !访问路径.startsWith('sb') && !访问路径.startsWith('quan') && !访问路径.startsWith('loon') && !访问路径.startsWith('sh') && !访问路径.startsWith('quantumult') && !访问路径.startsWith('stash') && !访问路径.startsWith('v2ray') && !访问路径.startsWith('mihomo') && !访问路径.startsWith('meta') && !访问路径.startsWith('xray') && !访问路径.startsWith('hysteria') && !访问路径.startsWith('tuic') && !访问路径.startsWith('wireguard') && !访问路径.startsWith('nekobox') && !访问路径.startsWith('sing-box') && !访问路径.startsWith('naive') && !访问路径.startsWith('total') && !访问路径.startsWith('foxray') && !访问路径.startsWith('matsuri') && !访问路径.startsWith('surge') && !访问路径.startsWith('shadow') && !访问路径.startsWith('stash') && !访问路径.startsWith('shadowrocket') && !访问路径.startsWith('stash') && !访问路径.startsWith('stash') && !uuidRegex.test(访问路径)) {
			if (!管理员密码) return fetch(Pages静态页面 + '/noADMIN').then(r => { const headers = new Headers(r.headers); headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); headers.set('Pragma', 'no-cache'); headers.set('Expires', '0'); return new Response(r.body, { status: 404, statusText: r.statusText, headers }) });
			if (访问路径 === '' || 访问路径 === '/') return fetch(Pages静态页面 + '/index.html');
			if (访问路径 === 'robots.txt') return new Response('User-agent: *\nDisallow:', { headers: { 'Content-Type': 'text/plain' } });
			if (访问路径 === 'favicon.ico') return new Response('', { status: 204 });
			const authCookie = request.headers.get('Cookie')?.match(/auth=([^;]+)/)?.[1];
			if (访问路径 === 'login') {
				if (authCookie == await MD5MD5(UA + 加密秘钥 + 管理员密码)) return new Response('重定向中...', { status: 302, headers: { 'Location': '/admin' } });
				if (request.method === 'POST') {
					try {
						const { password: 输入密码 } = await request.json();
						if (输入密码 === (typeof 管理员密码 === 'string' ? 管理员密码.replace(/[\r\n]/g, '') : 管理员密码)) {
							const 响应 = new Response('登录成功', { status: 302, headers: { 'Location': '/admin' } });
							响应.headers.set('Set-Cookie', `auth=${await MD5MD5(UA + 加密秘钥 + 管理员密码)}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Strict`);
							return 响应;
						}
					} catch {}
				}
				return fetch(Pages静态页面 + '/login');
			} else if (访问路径 === 'admin' || 访问路径.startsWith('admin/')) {
				const authCookie = request.headers.get('Cookie')?.match(/auth=([^;]+)/)?.[1];
				if (!authCookie || authCookie !== await MD5MD5(UA + 加密秘钥 + 管理员密码)) return new Response('重定向中...', { status: 302, headers: { 'Location': '/login' } });
				if (访问路径 === 'admin/log.json') {
					return new Response(JSON.stringify({ logs: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
				} else if (区分大小写访问路径 === 'admin/getCloudflareUsage') {
					return new Response(JSON.stringify({ success: true, pages: 0, workers: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
				} else if (区分大小写访问路径 === 'admin/getADDAPI') {
					return new Response(JSON.stringify({ valid: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
				} else if (访问路径 === 'admin/check') {
					return new Response(JSON.stringify({ error: '请提供代理参数' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
				}
				if (访问路径 === 'admin/init') {
					return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
				}
				if (访问路径 === 'admin/config.json') {
					if (request.method === 'POST') {
						return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
					}
					return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
				}
				if (访问路径 === 'admin/cf.json') {
					if (request.method === 'POST') {
						return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
					}
					return new Response(JSON.stringify(request.cf), { status: 200, headers: { 'Content-Type': 'application/json' } });
				}
				if (访问路径 === 'admin/tg.json') {
					if (request.method === 'POST') {
						return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
					}
					return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
				}
				ctx.waitUntil(请求日志记录(env, request, 访问IP, 'Admin_Login', config_JSON));
				return fetch(Pages静态页面 + '/admin' + url.search);
			} else if (访问路径 === 'logout' || uuidRegex.test(访问路径)) {
				const 响应 = new Response('重定向中...', { status: 302, headers: { 'Location': '/login' } });
				响应.headers.set('Set-Cookie', 'auth=; Path=/; Max-Age=0; HttpOnly');
				return 响应;
			} else if (访问路径 === 'sub') {
				return new Response('Subscription not configured', { status: 200, headers: { 'Content-Type': 'text/plain' } });
			}
		}
		return fetch(request);
	}
};

// ========================================
// Helper Functions
// ========================================

async function 整理成数组(输入) {
	if (typeof 输入 === 'string') return 输入.split(',').map(s => s.trim()).filter(Boolean);
	if (Array.isArray(输入)) return 输入.flat().filter(Boolean);
	return [];
}

async function MD5MD5(输入) {
	const 字符串 = typeof 输入 === 'string' ? 输入 : JSON.stringify(输入);
	const 编码 = new TextEncoder();
	const 数据 = 编码.encode(字符串);
	const 哈希 = await crypto.subtle.digest('SHA-256', 数据);
	const 哈希数组 = Array.from(new Uint8Array(哈希));
	const 十六进制 = 哈希数组.map(b => b.toString(16).padStart(2, '0')).join('');
	const 第二哈希 = await crypto.subtle.digest('SHA-256', 编码.encode(十六进制));
	const 第二哈希数组 = Array.from(new Uint8Array(第二哈希));
	return 第二哈希数组.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function DNS解析批量反代IP(反代IPs) {
	const 结果 = [];
	for (const 反代IP of 反代IPs) {
		try {
			const 解析结果 = await fetch(`https://1.1.1.1/dns-query?name=${反代IP}&type=A`, { headers: { 'Accept': 'application/dns-json' } });
			const 数据 = await 解析结果.json();
			if (数据.Answer) {
				数据.Answer.forEach(record => { if (record.type === 1) 结果.push(record.data); });
			}
		} catch {}
	}
	return 结果;
}

function 识别运营商(request) {
	const cfIP = request.headers.get('CF-IPCountry') || request.cf?.country || '';
	if (cfIP === 'CN') {
		const asn = request.cf?.asn || 0;
		if (asn === 56040 || asn === 56041 || asn === 9808) return 'cmcc';
		if (asn === 4837 || asn === 58453) return 'cu';
		if (asn === 23724 || asn === 23911) return 'ct';
	}
	return '';
}

async function 请求日志记录(env, request, 访问IP, 请求类型, config_JSON, 是否写入KV日志 = true) {
	// NaderVPN - Log recording placeholder
}

export { MD5MD5, 整理成数组 };