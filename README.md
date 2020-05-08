# 垃圾分类小程序
1. 小程序实现介绍： https://www.jianshu.com/p/af26c1af62f7
2. 小程序中有用到百度ai的图片识别和语音识别接口，需自己到百度平台申请，然后用对应的key替换。
   替换文件cloudfunctions-baiduAccessToken-index.js中的apiKey和secretKey。
   ```
    let apiKey = '替换成自己的百度ai上的接口apiKey',
    grantType = 'client_credentials',
    secretKey = '替换成自己的secretKey',
    url = `https://aip.baidubce.com/oauth/2.0/token`
   ```
3. 小程序中有用到云开发，具体介绍请参考微信小程序官方文档，初始化云开发后， 替换app.js中env的值。
    ```
    wx.cloud.init({
                    env: '替换成自己的云开发环境id',
                    traceUser: true,
                })
    ```
    
 4. 常见问题：
    https://mp.weixin.qq.com/s/-Z5RotNye2zdSX3-W1Bfkw
