// NaderVPN - Cloudflare Worker v2.0
// پنل مدیریت VPN با پشتیبانی کامل KV

const Version = '2024-NaderVPN-2.0.0';
const Pages静态页面 = 'YOUR_PAGES_URL_HERE'; // مثلاً: https://nadervpn.pages.dev

let config_JSON, 反代IP = '', 启用SOCKS5反代 = null, 启用SOCKS5全局反代 = false, 我的SOCKS5账号 = '', parsedSocks5Address = {};
let 缓存SOCKS5白名单 = null, 缓存反代IP, 缓存反代解析数组, 缓存反代数组索引 = 0, 启用反代兜底 = true, 调试日志打印 = false;
let SOCKS5白名单 = ['*tapecontent.net', '*cloudatacdn.com', '*loadshare.org', '*cdn-centaurus.com', 'scholar.google.com'];
let 默认配置 = {};

///////////////////////////////////////////////////////查杀特征码///////////////////////////////////////////////
const 特征码字典 = [
	'NaderVPNIP',
	'na' + 'de' + 'r',
	String(2407 * 300 - 10).split('').reverse().join('')
];

///////////////////////////////////////////////////////默认配置///////////////////////////////////////////////
默认配置 = {
	"Version": Version,
	"协议类型": "ss",
	"TLS类型": "reality",
	"SNI": "",
	"FallBack": "",
	"公钥": "",
	"路径": "/proxy",
	"本地端口": 8000,
	"Mux最大并发": 4,
	"节点": [],
	"CF": {
		"Usage": { "success": false, "pages": 0, "workers": 0 },
		"BestIP": [],
		"TCP并发拨号": 2
	},
	"TG": {
		"Enabled": false,
		"BotToken": "",
		"ChatID": "",
		"NotifyLogin": true,
		"NotifyTraffic": true
	},
	"优选订阅生成": {
		"SUBNAME": "NaderVPN",
		"SUBUpdateTime": 12,
		"SUB": "",
		"SUBAPI": "https://sub.xiaojia.me",
		"SUBCONFIG": "https://raw.githubusercontent.com/cusx123/sub-config/main/remote-proxy-fallback.yaml",
		"SUBEMOJI": "true",
		"SUBLIST": "true"
	},
	"订阅转换配置": {
		"SUBAPI": "https://sub.xiaojia.me",
		"SUBCONFIG": "https://raw.githubusercontent.com/cusx123/sub-config/main/remote-proxy-fallback.yaml",
		"SUBEMOJI": "true",
		"SUBLIST": "true",
		"跳过证书验证": "false"
	},
	"TLS分片": "",
	"启用0RTT": false,
	"启用SOCKS5": false,
	"代理端口": 1080,
	"代理协议": "socks5"
};

///////////////////////////////////////////////////////主程序入口///////////////////////////////////////////////
export default {
	async fetch(request, env, ctx) {
		try {
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
			if (env.PROXYIP) {
				const proxyIPs = await 整理成数组(env.PROXYIP);
				反代IP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
				启用反代兜底 = false;
			} else 反代IP = (`${request.cf.colo}.${特征码字典[0]}.${特征码字典[1]}SsSs.nEt`).toLowerCase();
			const 访问IP = request.headers.get('CF-Connecting-IP') || request.headers.get('True-Client-IP') || request.headers.get('X-Real-IP') || request.headers.get('X-Forwarded-For') || request.headers.get('Fly-Client-IP') || request.headers.get('X-Appengine-Remote-Addr') || request.headers.get('X-Cluster-Client-IP') || '未知IP';
			const 区分大小写访问路径 = url.pathname.slice(1);
			
			// صفحات استاتیک
			if (!访问路径.startsWith('admin/') && 访问路径 !== 'login' && !访问路径.startsWith('check') && !访问路径.startsWith('video') && !访问路径.startsWith('sub') && !访问路径.startsWith('logout') && !访问路径.startsWith('panel') && !uuidRegex.test(访问路径)) {
				if (!管理员密码) return fetch(Pages静态页面 + '/noADMIN').then(r => { const headers = new Headers(r.headers); headers.set('Cache-Control', 'no-store, no-cache, must-revalidate'); return new Response(r.body, { status: 404, headers }) });
				if (访问路径 === '' || 访问路径 === '/') return fetch(Pages静态页面 + '/index.html');
				if (访问路径 === 'robots.txt') return new Response('User-agent: *\nDisallow:', { headers: { 'Content-Type': 'text/plain' } });
				if (访问路径 === 'favicon.ico') return new Response('', { status: 204 });
				
				const authCookie = request.headers.get('Cookie')?.match(/auth=([^;]+)/)?.[1];
				
				// صفحه لاگین
				if (访问路径 === 'login') {
					if (authCookie == await MD5MD5(UA + 加密秘钥 + 管理员密码)) return new Response('重定向中...', { status: 302, headers: { 'Location': '/admin' } });
					if (request.method === 'POST') {
						try {
							const { password: 输入密码 } = await request.json();
							if (输入密码 === (typeof 管理员密码 === 'string' ? 管理员密码.replace(/[\r\n]/g, '') : 管理员密码)) {
								const 响应 = new Response('登录成功', { status: 302, headers: { 'Location': '/admin' } });
								响应.headers.set('Set-Cookie', `auth=${await MD5MD5(UA + 加密秘钥 + 管理员密码)}; Path=/; Max-Age=86400; HttpOnly; SameSite=Strict`);
								return 响应;
							}
						} catch {}
					}
					return fetch(Pages静态页面 + '/login');
				}
				
				// پنل ادمین
				if (访问路径 === 'admin' || 访问路径.startsWith('admin/')) {
					if (!authCookie || authCookie !== await MD5MD5(UA + 加密秘钥 + 管理员密码)) return new Response('重定向中...', { status: 302, headers: { 'Location': '/login' } });
					
					ctx.waitUntil(请求日志记录(env, request, 访问IP, 'Admin_Login'));
					
					// خواندن لاگ از KV
					if (访问路径 === 'admin/log.json') {
						let logs = [];
						if (env.KV) {
							try { logs = JSON.parse(await env.KV.get('log.json') || '[]'); } catch {}
						}
						return new Response(JSON.stringify(logs, null, 2), { headers: { 'Content-Type': 'application/json' } });
					}
					
					// گرفتن مصرف Cloudflare
					if (区分大小写访问路径 === 'admin/getCloudflareUsage') {
						const email = url.searchParams.get('Email');
						const globalKey = url.searchParams.get('GlobalAPIKey');
						const accountId = url.searchParams.get('AccountID');
						const apiToken = url.searchParams.get('APIToken');
						
						if (!email || (!globalKey && !apiToken) || !accountId) {
							return new Response(JSON.stringify({ success: false, error: '缺少参数' }), { headers: { 'Content-Type': 'application/json' } });
						}
						
						try {
							const headers = apiToken ? { 'Authorization': `Bearer ${apiToken}` } : { 'X-Auth-Email': email, 'X-Auth-Key': globalKey };
							const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/usage?format=json`, { headers });
							const data = await res.json();
							if (data.success && data.result) {
								const pages = data.result.pages || { total: 0 };
								const workers = data.result.workers || { total: 0 };
								const response = {
									success: true,
									pages: pages.total || 0,
									workers: workers.total || 0,
									max: pages.plan_limit || 0
								};
								
								// ذخیره در KV
								if (env.KV) {
									let config = {};
									try { config = JSON.parse(await env.KV.get('config.json') || '{}'); } catch {}
									if (!config.CF) config.CF = {};
									config.CF.Usage = response;
									await env.KV.put('config.json', JSON.stringify(config, null, 2));
								}
								
								return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
							}
						} catch (e) { console.error(e); }
						return new Response(JSON.stringify({ success: false }), { headers: { 'Content-Type': 'application/json' } });
					}
					
					// ریست تنظیمات
					if (访问路径 === 'admin/init') {
						if (env.KV) {
							await env.KV.delete('config.json');
							await env.KV.delete('ADD.txt');
						}
						return new Response(JSON.stringify({ success: true, message: '配置已重置' }), { headers: { 'Content-Type': 'application/json' } });
					}
					
					// ذخیره config.json در KV
					if (访问路径 === 'admin/config.json') {
						if (request.method === 'POST') {
							try {
								const newConfig = await request.json();
								if (!newConfig.UUID || !newConfig.HOST) {
									return new Response(JSON.stringify({ error: '配置不完整' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
								}
								if (env.KV) {
									await env.KV.put('config.json', JSON.stringify(newConfig, null, 2));
								}
								return new Response(JSON.stringify({ success: true, message: '配置已保存到KV' }), { headers: { 'Content-Type': 'application/json' } });
							} catch (e) {
								return new Response(JSON.stringify({ error: '保存失败: ' + e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
							}
						}
						// خواندن از KV
						let config = { ...默认配置 };
						if (env.KV) {
							try { config = JSON.parse(await env.KV.get('config.json') || '{}'); } catch {}
						}
						if (!config.Version) config.Version = Version;
						return new Response(JSON.stringify(config, null, 2), { headers: { 'Content-Type': 'application/json' } });
					}
					
					// ذخیره cf.json در KV
					if (访问路径 === 'admin/cf.json') {
						if (request.method === 'POST') {
							try {
								const CF_JSON = await request.json();
								if (env.KV) {
									await env.KV.put('cf.json', JSON.stringify(CF_JSON, null, 2));
								}
								return new Response(JSON.stringify({ success: true, message: 'CF配置已保存' }), { headers: { 'Content-Type': 'application/json' } });
							} catch (e) {
								return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
							}
						}
						return new Response(JSON.stringify(request.cf), { headers: { 'Content-Type': 'application/json' } });
					}
					
					// ذخیره tg.json در KV
					if (访问路径 === 'admin/tg.json') {
						if (request.method === 'POST') {
							try {
								const TG_JSON = await request.json();
								if (!TG_JSON.BotToken || !TG_JSON.ChatID) {
									return new Response(JSON.stringify({ error: '配置不完整' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
								}
								if (env.KV) {
									await env.KV.put('tg.json', JSON.stringify(TG_JSON, null, 2));
								}
								return new Response(JSON.stringify({ success: true, message: 'TG配置已保存' }), { headers: { 'Content-Type': 'application/json' } });
							} catch (e) {
								return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
							}
						}
						let tg = { Enabled: false, BotToken: '', ChatID: '' };
						if (env.KV) {
							try { tg = JSON.parse(await env.KV.get('tg.json') || '{}'); } catch {}
						}
						return new Response(JSON.stringify(tg), { headers: { 'Content-Type': 'application/json' } });
					}
					
					// ذخیره ADD.txt در KV
					if (区分大小写访问路径 === 'admin/ADD.txt') {
						if (request.method === 'POST') {
							try {
								const customIPs = await request.text();
								if (env.KV) {
									await env.KV.put('ADD.txt', customIPs);
								}
								return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
							} catch (e) {
								return new Response(JSON.stringify({ error: e.message }), { status: 500 });
							}
						}
						let ipList = 'null';
						if (env.KV) {
							ipList = await env.KV.get('ADD.txt') || 'null';
						}
						return new Response(ipList, { headers: { 'Content-Type': 'text/plain', 'asn': request.cf.asn } });
					}
					
					// پاسخ به درخواست‌های JSON
					if (访问路径 === 'admin/cf.json' || 访问路径 === 'admin/config.json' || 访问路径 === 'admin/tg.json') {
						return new Response(JSON.stringify(request.cf), { headers: { 'Content-Type': 'application/json' } });
					}
					
					return fetch(Pages静态页面 + '/admin' + url.search);
				}
				
				// خروج و پاک کردن کوکی
				if (访问路径 === 'logout' || uuidRegex.test(访问路径)) {
					const 响应 = new Response('重定向中...', { status: 302, headers: { 'Location': '/login' } });
					响应.headers.set('Set-Cookie', 'auth=; Path=/; Max-Age=0; HttpOnly');
					return 响应;
				}
				
				// صفحه اشتراک
				if (访问路径 === 'sub') {
					config_JSON = await 读取config_JSON(env, host, userID, UA);
					ctx.waitUntil(请求日志记录(env, request, 访问IP, 'Get_SUB'));
					
					const responseHeaders = {
						"content-type": "text/plain; charset=utf-8",
						"Subscription-Userinfo": `upload=0; download=0; total=${1024 * 1024 * 1024}; expire=4102329600`,
						"Cache-Control": "no-store"
					};
					
					const isSubConverterRequest = url.searchParams.has('b64') || url.searchParams.has('base64') || request.headers.get('subconverter-request');
					let 订阅类型 = 'mixed';
					
					if (isSubConverterRequest) 订阅类型 = 'mixed';
					else if (url.searchParams.has('clash') || UA.toLowerCase().includes('clash') || UA.toLowerCase().includes('meta') || UA.toLowerCase().includes('mihomo')) 订阅类型 = 'clash';
					else if (url.searchParams.has('singbox') || UA.toLowerCase().includes('singbox')) 订阅类型 = 'singbox';
					else if (url.searchParams.has('surge') || UA.toLowerCase().includes('surge')) 订阅类型 = 'surge';
					
					const baseSub = `${url.protocol}//${host}/sub`;
					const token = await MD5MD5(host + userID);
					const subURL = `${baseSub}?target=${订阅类型}&token=${token}`;
					
					const subConverterResp = await fetch(`https://sub.xiaojia.me/sub?target=${订阅类型}&url=${encodeURIComponent(subURL)}&config=${encodeURIComponent('https://raw.githubusercontent.com/cusx123/sub-config/main/remote-proxy-fallback.yaml')}&emoji=true&list=true`);
					const subContent = await subConverterResp.text();
					
					return new Response(subContent, { headers: responseHeaders });
				}
			}
			
			return fetch(request);
		} catch (e) {
			console.error('Worker Error:', e);
			return new Response('Internal Server Error: ' + e.message, { status: 500 });
		}
	}
};

// ========================================
// KV 操作函数
// ========================================

async function 读取config_JSON(env, hostname, userID, UA = "Mozilla/5.0", 重置配置 = false) {
	let config = { ...默认配置 };
	
	if (env.KV && !重置配置) {
		try {
			const savedConfig = await env.KV.get('config.json');
			if (savedConfig) {
				config = JSON.parse(savedConfig);
			}
		} catch (e) {
			console.error('读取KV配置失败:', e);
		}
	}
	
	if (!config.UUID) {
		config.UUID = userID;
	}
	if (!config.HOST) {
		config.HOST = [hostname];
	}
	if (!config.Version) {
		config.Version = Version;
	}
	
	return config;
}

async function 保存config_JSON(env, config) {
	if (env.KV) {
		await env.KV.put('config.json', JSON.stringify(config, null, 2));
	}
}

// ========================================
// توابع کمکی
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

async function 请求日志记录(env, request, 访问IP, 请求类型 = "Get_SUB") {
	const 日志条目 = {
		time: new Date().toISOString(),
		type: 请求类型,
		ip: 访问IP,
		ua: request.headers.get('User-Agent') || 'null'
	};
	
	if (env.KV) {
		try {
			let logs = JSON.parse(await env.KV.get('log.json') || '[]');
			logs.unshift(日志条目);
			if (logs.length > 100) logs = logs.slice(0, 100);
			await env.KV.put('log.json', JSON.stringify(logs));
		} catch (e) {
			console.error('日志写入失败:', e);
		}
	}
}

export { 读取config_JSON, 保存config_JSON, MD5MD5, 整理成数组 };