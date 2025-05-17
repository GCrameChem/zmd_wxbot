// config.js
const config = {
  // 默认接口根地址，可以根据不同环境修改
  // 服务器地址
  base_url: 'http://1.14.92.141:8080',

  // 本地后端1
  // base_url: 'http://localhost:5000',

  // 真机调试：需要切换为电脑所在局域网,但最好手机和电脑处于同一局域网下不然很容易超时
  //base_url: 'http://172.23.38.197:8080',
  // 本地后端2
  //base_url: 'http://localhost:8080',

  // 其他
  // base_url: 'https://yunxig.cn/sendCode',  // 你的后端接口地址
  // base_url: 'http://192.168.50.225:8080',
  // base_url: 'http://172.20.10.4:8080',
}

module.exports = config;
