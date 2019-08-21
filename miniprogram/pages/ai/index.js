var checkPermissionUtil = require('../../utils/check-permission-util.js');
var baiduTokenUtil = require('../../utils/baidu-token-util.js');

Page({
    data: {
        SHOW_TOP: true,
        canRecordStart: false,
    },
    isSpeaking: false,
    accessToken: "",
    onLoad: function (options) {
        console.log("onLoad！");
        var that=this
        wx.showShareMenu({
            withShareTicket: true //要求小程序返回分享目标信息
        });
        var isShowed = wx.getStorageSync("tip");
        if (isShowed != 1) {
            setTimeout(() => {
                this.setData({
                    SHOW_TOP: false
                })
                wx.setStorageSync("tip", 1)
            }, 3 * 1000)
        } else {
            this.setData({
                SHOW_TOP: false
            })
        };
        try {
            baiduTokenUtil.getBdAiAccessToken().then(
                function (res) {
                    console.log('获取百度ai token:' + JSON.stringify(res));
                    console.log(res.access_token)
                    that.accessToken = res.access_token ;
                }, function (error) {
                    console.error('获取百度ai token:' + error);
                }
            );
        } catch (error) {
            console.error(error);
        }
    },

    goSearch: function () {
        wx.navigateTo({
            url: '/pages/ai/search'
        });
    },

    onBindCamera: function () {
        console.log('onBindCamera!');
        var that = this;
        try {
            checkPermissionUtil.checkPermission('scope.camera').then(function (res) {
                    console.log('检测权限结果：' + res);
                    wx.navigateTo({
                        url: 'camera/camera',
                    });
                }, function (err) {
                    console.error('检测权限结果失败：' + err);
                    wx.showToast({
                        title: '授权失败，无法使用该功能~',
                        icon: 'none'

                    });
                }
            );
        } catch (err) {
            console.error(err);
            wx.showToast({
                title: '授权失败，无法使用该功能~',
                icon: 'none'

            });
            return
        }
    },


    onTouchStart: function () {
        console.log('onTouchStart!' + this.data.canRecordStart);
        speaking.call(this);
        this.setData({
            canRecordStart: true
        });
        this.startRecordHandle();
    },

    onTouchEnd: function () {
        console.log('onTouchEnd!canRecordStart:' + this.data.canRecordStart + '----isSpeaking:' + this.isSpeaking);
        clearInterval(this.timer);
        this.setData({
            canRecordStart: false
        });
        if (this.isSpeaking) {
            wx.getRecorderManager().stop();
        }

    },

    // 2. 录音前检测scope.record授权情况
    async startRecordHandle() {
        var that = this;
        try {
            await checkPermissionUtil.checkPermission('scope.record').then(function (res) {
                    console.log('检测权限结果：' + res);
                    that.record();
                }, function (err) {
                    console.error('检测权限结果失败：' + err);
                    wx.showToast({
                        title: '授权失败，无法使用该功能~',
                        icon: 'none'

                    });
                }
            );
        } catch (err) {
            console.error(err);
            wx.showToast({
                title: '授权失败，无法使用该功能~',
                icon: 'none'

            });
            return
        }
    },

    //开始录音的时候
    record: function () {
        var that = this;
        console.log('startRecord!');
        const recorderManager = wx.getRecorderManager();
        const options = {
            duration: 30000,//指定录音的时长，单位 ms
            sampleRate: 16000,//采样率
            numberOfChannels: 1,//录音通道数
            encodeBitRate: 48000,//编码码率
            format: 'aac',//音频格式，有效值 aac/mp3
        };

        console.log('开始正式录音前，canRecordStart：' + this.data.canRecordStart);
        //开始录音
        if (this.data.canRecordStart) {
            recorderManager.start(options);
            this.isSpeaking = true;
        }
        recorderManager.onStart(() => {
            console.log('recorder start')

        });


        recorderManager.onPause(() => {
            console.log('recorder pause')
        })
        recorderManager.onStop((res) => {
            this.isSpeaking = false;
            console.log('recorder stop', res);
            //wx.hideLoading();
            if (res && res.duration < 1000) {
                wx.showToast({
                    title: '说话时间太短啦！',
                    icon: 'none'

                })
                return;
            }
            if (res && res.duration > 8000) {
                wx.showToast({
                    title: '说的有点长，可以精简点呀~',
                    icon: 'none'
                })
                return;
            }
            const {tempFilePath} = res
            this.speechRecognition(res);
        })


        //错误回调
        recorderManager.onError((res) => {
            // wx.showToast({
            //     title: '录音出错啦，请重试！',
            //
            // });
            console.error('录音错误回调：' + JSON.stringify(res));
        })
    },


    speechRecognition: function (res) {
        wx.showLoading({
            title: '识别中...',
        })
        var that = this;
        var fileSize = res.fileSize;
        var tempFilePath = res.tempFilePath;
        var format = 'pcm';
        if (tempFilePath) {
            format = tempFilePath.substring(tempFilePath.lastIndexOf('.') + 1);
        }
        const fileSystemManager = wx.getFileSystemManager()
        fileSystemManager.readFile({
            filePath: res.tempFilePath,
            encoding: "base64",
            success(res){
                console.log(res);
                var base64 = res.data;
                var data = {
                    "format": format,
                    "rate": 16000,
                    "dev_pid": 80001,
                    "channel": 1,
                    "token": that.accessToken,
                    "cuid": "baidu_workshop",
                    "len": fileSize,
                    "speech": base64
                }

                console.log('语音识别请求参数：' + JSON.stringify(data));
                wx.request({
                    url: 'https://vop.baidu.com/pro_api',
                    method: 'post',
                    data: data,
                    success (res) {
                        wx.hideLoading();
                        console.log(res.data)
                        var result = res.data.result;
                        if (result && result.length > 0) {
                            var location = result[0].lastIndexOf("。");
                            var text = '';
                            console.log(result[0]);
                            console.log('符号位置：' + location);

                            text = result[0].replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\。|\，|\！|\；|\>|\/|\?]/g, "");
                            console.log('text' + text);
                            wx.navigateTo({
                                url: '/pages/ai/search?searchText=' + text
                            })
                        } else {
                            //没有result，认为语音识别失败
                            wx.showModal({
                                title: '提示',
                                content: '不知道你说的啥，可以再试试~',
                                showCancel: false,
                                success (res) {
                                    if (res.confirm) {
                                        console.log('用户点击确定')
                                    } else if (res.cancel) {
                                        console.log('用户点击取消')
                                    }
                                }
                            })

                        }


                    },
                    fail(error){
                        wx.hideLoading();
                        console.log(error);
                        wx.showToast({
                            icon: 'none',
                            title: '请求失败了，请确保网络正常，重新试试~',
                        })
                    }

                })

            },
            fail(res){
                wx.hideLoading();
                console.log(res)
            }
        })

    },


});

//麦克风帧动画
function speaking() {
    var _this = this;
    //话筒帧动画
    var i = 1;
    this.timer = setInterval(function () {
        i++;
        i = i % 5;
        _this.setData({
            j: i
        })
    }, 200);
}