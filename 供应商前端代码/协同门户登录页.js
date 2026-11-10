<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="shortcut icon" href="./img/sohu.ico" type="image/x-icon" />
    <link rel="stylesheet" href="./css/style.css?v=20261101" />
    <link rel="stylesheet" href="./css/index.css?v=20261101" />
    <script src="./js/vue.min.js"></script>
    <!-- 这里使用了element ui框架 -->
    <script src="./element-ui/index.js"></script>
    <link rel="stylesheet" href="./element-ui/index.css" />
    <title>协同门户-登录</title>
  </head>

  <body>
    <div id="app">
      <!-- pc端 -->
      <div class="pc_view" style="position: absolute; overflow: hidden" v-if="!isApp">
        <div class="login_head">
          <img src="./img/sohuLogo.png" alt="" class="login_topImg" />
        </div>
        <div class="login_content">
          <div class="login_conBg">
            <img src="./img/wenzi.png" alt="" class="login_leftImg" />
          </div>
          <div class="login_form pos">
            <div class="login_form_tit">
              <p><span class="basic_title">用户登录</span></p>
              <p>Please login or register</p>
            </div>
            <el-form
              :model="ruleForm"
              ref="formName"
              status-icon
              :rules="rules"
              label-width="100px"
              class="demo-ruleForm"
              label-position="right"
              autocomplete="off"
            >
              <el-form-item label="账号" prop="account">
                <el-input v-model="ruleForm.account" placeholder="请输入登录账号" @input="resetLoginStep"></el-input>
              </el-form-item>
              <el-form-item label="密码" prop="pwd">
                <el-input type="password" autocomplete="current-password"
                  v-model="ruleForm.pwd" placeholder="请输入登录密码" @input="resetLoginStep"></el-input>
              </el-form-item>
              <el-form-item label="验证码" prop="code" class="codeItem">
                <el-input autocomplete="off" style="width: 220px"
                  v-model="ruleForm.code" placeholder="请输入验证码" @input="resetLoginStep"></el-input>
                <img
                  v-if="updateImgSrc"
                  :src="updateImgSrc"
                  @click="getCode"
                  alt=""
                  style="cursor: pointer"
                />
                <a href="javascript:;;" @click="getCode">换一张</a>
              </el-form-item>
              <template v-if="loginValidated">
                <el-form-item label="注册邮箱" prop="email">
                  <el-input :class="isApp?'appWidth':''" v-model="ruleForm.email"
                    autocomplete="off" placeholder="请输入注册邮箱"></el-input>
                  <span class="sendCode" v-if="showBtn" @click="checkAccountOrEmail">发送验证码</span>
                  <span class="contText" v-else>{{count}} s 后可重发</span>
                </el-form-item>
                <el-form-item label="邮箱验证码" prop="emailVerificationCode">
                  <el-input :class="isApp?'appWidth':''" v-model="ruleForm.emailVerificationCode" autocomplete="off" placeholder="请输入邮箱验证码"></el-input>
                </el-form-item>
              </template>
              <span class="login_update" @click="changePwd">修改密码</span>
              <el-form-item class="mgrtop30">
                <el-button type="primary" @click="submitForm()">{{loginValidated ? '登录' : '下一步'}}</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
      <!-- 移动端 -->
      <div class="app_view" style="position: absolute" v-else-if="isApp">
        <div class="container">
          <!-- 标题 -->
          <div class="title">
            <div class="left-line"></div>
            <div class="mid-title">基本信息</div>
            <div class="right-line"></div>
          </div>
          <!-- 表单内容 -->
          <div class="form-zone">
            <el-form
              :model="ruleForm"
              ref="formName"
              status-icon
              :rules="rules"
              label-width="100px"
              class="demo-ruleForm"
              label-position="top"
            >
              <el-form-item label="账号" prop="account">
                <el-input
                  class="appWidth"
                  v-model="ruleForm.account"
                  placeholder="请输入登录账号"
                ></el-input>
              </el-form-item>
              <el-form-item label="密码" prop="pwd">
                <el-input
                  class="appWidth"
                  type="password"
                  v-model="ruleForm.pwd"
                  autocomplete="off"
                  placeholder="请输入登录密码"
                ></el-input>
              </el-form-item>
              <el-form-item label="验证码" prop="code" class="codeItem">
                <el-input
                  v-model="ruleForm.code"
                  autocomplete="off"
                  placeholder="请输入验证码"
                  style="width: 37%"
                ></el-input>
                <img
                  v-if="updateImgSrc"
                  :src="updateImgSrc"
                  @click="getCode"
                  alt=""
                  style="cursor: pointer"
                />
                <a href="javascript:;;" @click="getCode">换一张</a>
              </el-form-item>
              <template v-if="loginValidated">
                <el-form-item label="注册邮箱" prop="email">
                  <el-input class="appWidth" v-model="ruleForm.email"
                    autocomplete="off" placeholder="请输入注册邮箱"></el-input>
                  <span class="sendCode" v-if="showBtn" @click="checkAccountOrEmail">发送验证码</span>
                  <span class="contText" v-else>{{count}} s 后可重发</span>
                </el-form-item>
                <el-form-item label="邮箱验证码" prop="emailVerificationCode">
                  <el-input class="appWidth" v-model="ruleForm.emailVerificationCode" autocomplete="off" placeholder="请输入邮箱验证码"></el-input>
                </el-form-item>
              </template>
              <span class="login_update" style="margin-left: 0;" @click="changePwd">修改密码</span>
              <el-form-item class="bottom_btn">
                <el-button type="primary" @click="submitForm()">{{loginValidated ? '登录' : '下一步'}}</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
    <script src="./js/jquery.min.js"></script>
    <script src="./js/public.js"></script>
    <script src="https://erpwebstatic.bjcnc.scs.sohucs.com/lib/blueimp-md5/md5.v2.10.0.min.js"></script>
    <script>
      new Vue({
        el: "#app",
        components: {},
        data() {
          return {
            isApp: false,
            // hostUrl:'10.2.147.108:40080',
            // hostUrl: 'https://supplier-user-service.sohu-inc.com',
            hostUrl: 'https://supplier-user-service-test.sohu-inc.com',
            updateImgSrc: "",
            loginValidated: false,
            count: '',
            showBtn: true,
            timer: null,
            ruleForm: {
              account: '', //账号
              pwd: '', //密码
              code: '',
              email: '',
              emailVerificationCode: '',
            },
            rules: {
              account: [{ required: true, message: "请输入账号", trigger: "blur" }],
              pwd: [{ required: true, message: "请输入密码", trigger: "blur" }],
              code: [{ required: true, message: "请输入验证码", trigger: "blur" }],
              email: [
                { required: true, message: '请输入注册邮箱', trigger: 'blur' },
                { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
              ],
              emailVerificationCode: [
                { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
              ],
            },
          };
        },
        created() {
          this.isApp = this.judge() == "app";
          console.log(this.judge(), "--设备名称");
        },
        mounted() {
          this.getCode();
          this.adjustForKeyboard();
        },
        methods: {
          // 提交登录表单；未完成预校验时进入账号密码校验阶段，已完成预校验时进入邮箱验证码登录阶段并在后端返回 token 后执行跳转。
          submitForm() {
            let _this = this;
            if (!_this.loginValidated) {
              _this.checkLogin();
              return;
            }
            _this.$refs["formName"].validate((valid) => {
              if (valid) {
                const data = {
                  userCode: _this.ruleForm.account,
                  email:_this.ruleForm.email,
                  verificationCode:_this.ruleForm.emailVerificationCode
                };
                jQuery.ajax({
                  url: `${_this.hostUrl}/user/userToken/emailLogin`,
                  type: "post",
                  dataType: "json",
                  contentType: "application/json;charset=utf-8",
                  xhrFields: {
                    withCredentials: true,
                  },
                  data: JSON.stringify(data),
                  success: function (result) {
                    if (result.code == 2000) {
                      _this.redirectAfterLogin(result.data);
                      // 调用解析token接口，然后获取token中的
                      /*jQuery.ajax({
                        url: `${_this.hostUrl}/user/tokenInfo?supplierToken=` + result.data,
                        type: "get",
                        dataType: "json",
                        contentType: "application/json;charset=utf-8",
                        xhrFields: {
                          withCredentials: true,
                        },
                        success: function (res) {
                          console.log(res, "res");
                          if (res.code == 2000) {
                            let status = res.data.status;
                            let hrefStr = "";
                            if (_this.isApp) {
                              // app登录
                              switch (status) {
                                case 0:
                                  hrefStr = ENV.supplierPortalRegistWAP;
                                  break;
                                case 1:
                                  hrefStr = ENV.collaborationPortalWAP;
                                  break;
                                case 2:
                                  hrefStr = ENV.preCollaborationPortalWAP;
                                  break;
                              }
                              ELEMENT.Message.success("登录成功");
                              setTimeout(() => {
                                location.href = hrefStr + "&ThirdPartyToken=" + result.data;
                              }, 1500);
                            } else {
                              // pc登录
                              switch (status) {
                                case 0:
                                  hrefStr = ENV.supplierPortalRegistPC;
                                  break;
                                case 1:
                                  hrefStr = ENV.collaborationPortalPC;
                                  break;
                                case 2:
                                  hrefStr = ENV.preCollaborationPortalPC;
                                  break;
                              }
                              ELEMENT.Message.success("登录成功");
                              setTimeout(() => {
                                location.href = hrefStr + "&ThirdPartyToken=" + result.data;
                              }, 1500);
                            }
                          } else {
                            _this.getCode();
                            ELEMENT.Message.error(res.msg);
                          }
                        },
                      });*/
                    } else {
                      _this.getCode();
                      ELEMENT.Message.error(result.msg);
                    }
                  },
                });
              } else {
                console.log("error submit!!");
                return false;
              }
            });
          },
          // 跳转到修改密码页面；登录页只负责入口跳转，密码更新流程由 updatePwd.html 独立处理。
          changePwd() {
            // location.href = 'https://supplier.sohu-inc.com/updatePwd.html';
            location.href = 'https://supplier-test.sohu-inc.com/updatePwd.html?v=20261101';
          },
          // 登录预校验；调用后端第一阶段接口校验账号、密码、图形验证码、注册邮箱维护状态和密码更新时间，成功后切换到邮箱验证码输入区。
          checkLogin() {
            let that = this;
            that.$refs['formName'].validate((valid) => {
              if (!valid) return;
              const data = {
                userCode: that.ruleForm.account,
                password: md5(that.ruleForm.pwd),
                verificationCode: that.ruleForm.code
              };
              jQuery.ajax({
                url: `${that.hostUrl}/user/userToken/preCheck`,
                type: 'post',
                dataType: 'json',
                contentType: 'application/json;charset=utf-8',
                xhrFields: {
                  withCredentials: true
                },
                data: JSON.stringify(data),
                success: function (res) {
                  if (res.code == 2000) {
                    that.loginValidated = true;
                    ELEMENT.Message.success('请完成邮箱验证码校验');
                  } else {
                    that.getCode();
                    ELEMENT.Message.error(res.msg);
                  }
                }
              });
            });
          },
          // 校验邮箱输入并发送验证码；账号邮箱匹配、注册邮箱维护状态等安全规则统一交给后端发送验证码接口处理。
          checkAccountOrEmail() {
            let that = this;
            if (!that.showBtn) return;
            that.$refs['formName'].validateField('email', (errorMessage) => {
              if (errorMessage) return;
              that.sendEmail();
            });
          },
          // 发送登录邮箱验证码；后端会校验登录预检状态、注册邮箱维护状态及账号邮箱关系。
          sendEmail() {
            let that = this;
            jQuery.ajax({
              url: `${that.hostUrl}/user/loginEmailVerification`,
              type: 'get',
              dataType: 'json',
              xhrFields: {
                withCredentials: true
              },
              data: {
                userCode: that.ruleForm.account,
                email: that.ruleForm.email
              },
              success: function (res) {
                if (res.code == 2000) {
                  ELEMENT.Message.success('发送成功');
                  that.startSend();
                } else {
                  ELEMENT.Message.error(res.msg);
                }
              }
            });
          },
          // 启动邮箱验证码重发倒计时；倒计时期间隐藏发送入口，避免用户短时间内重复触发发信。
          startSend() {
            const COUNTS = 60;
            if (!this.timer) {
              this.count = COUNTS;
              this.showBtn = false;
              this.timer = setInterval(() => {
                if (this.count > 0) {
                  this.count--;
                } else {
                  this.showBtn = true;
                  clearInterval(this.timer);
                  this.timer = null;
                }
              }, 1000);
            }
          },
          // 登录成功后解析 token 中的供应商状态，并按照注册中、正式协同、预协同三类状态跳转到对应门户。
          redirectAfterLogin(token) {
            let _t = this;
            jQuery.ajax({
              url: `${_t.hostUrl}/user/tokenInfo?supplierToken=` + token,
              type: 'get',
              dataType: 'json',
              contentType: 'application/json;charset=utf-8',
              xhrFields: {
                withCredentials: true
              },
              success: function (res) {
                console.log(res, 'res');
                /*if (res.code == 2000) {
                  if (res.data.status == 0) {
                    ELEMENT.Message.success('登录成功');
                    setTimeout(() => {
                      location.href = ENV.supplierPortalRegist + '&ThirdPartyToken=' + token;
                    }, 1500);
                  }
                  if (res.data.status == 1) {
                    ELEMENT.Message.success('登录成功');
                    setTimeout(() => {
                      location.href = ENV.collaborationPortal + '&ThirdPartyToken=' + token;
                    }, 1500);
                  }
                  if (res.data.status == 2) {
                    ELEMENT.Message.success('登录成功');
                    setTimeout(() => {
                      location.href = ENV.preCollaborationPortal + '&ThirdPartyToken=' + token
                    }, 1500)
                  }
                } else {
                  ELEMENT.Message.error(res.msg);
                }*/
                if (res.code == 2000) {
                  let status = res.data.status;
                  let hrefStr = "";
                  if (_t.isApp) {
                    // app登录
                    switch (status) {
                      case 0:
                        hrefStr = ENV.supplierPortalRegistWAP;
                        break;
                      case 1:
                        hrefStr = ENV.collaborationPortalWAP;
                        break;
                      case 2:
                        hrefStr = ENV.preCollaborationPortalWAP;
                        break;
                    }
                    ELEMENT.Message.success("登录成功");
                    setTimeout(() => {
                      location.href = hrefStr + "&ThirdPartyToken=" + token;
                    }, 1500);
                  } else {
                    // pc登录
                    switch (status) {
                      case 0:
                        hrefStr = ENV.supplierPortalRegistPC;
                        break;
                      case 1:
                        hrefStr = ENV.collaborationPortalPC;
                        break;
                      case 2:
                        hrefStr = ENV.preCollaborationPortalPC;
                        break;
                    }
                    ELEMENT.Message.success("登录成功");
                    setTimeout(() => {
                      location.href = hrefStr + "&ThirdPartyToken=" + token;
                    }, 1500);
                  }
                } else {
                  _t.getCode();
                  ELEMENT.Message.error(res.msg);
                }
              }
            });
          },
          // 重置邮箱验证阶段；账号、密码或图形验证码变更后，必须重新完成登录预校验和邮箱验证码校验。
          resetLoginStep() {
            if (!this.loginValidated) return;
            this.loginValidated = false;
            this.ruleForm.email = '';
            this.ruleForm.emailVerificationCode = '';
            this.showBtn = true;
            this.count = '';
            clearInterval(this.timer);
            this.timer = null;
          },
          // 刷新图形验证码图片；通过追加随机数避免浏览器缓存旧验证码图片。
          getCode() {
            this.updateImgSrc =
              this.hostUrl + "/user/verificationCodePicture?" + Math.floor(Math.random() * 100);
          },
          // 判断当前访问设备类型；移动端返回 app 用于切换表单布局，其他设备返回 pc。
          judge() {
            let str = navigator.userAgent.match(
              /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
            ) ? 'app' : 'pc';
            return str;
          },
          // 按参数名读取当前页面查询字符串中的值；注册和跳转场景会复用该工具方法解析 URL 参数。
          getQueryString(name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var r = window.location.search.substr(1).match(reg);
            if (r != null) {
              return unescape(r[2]);
            }
            return null;
          },
          adjustForKeyboard() {
            const appView = document.querySelector(".app_view");
            const originalHeight = window.innerHeight;

            window.addEventListener("resize", () => {
              const newHeight = window.innerHeight;

              if (newHeight < originalHeight) {
                // 键盘弹出
                appView.style.minHeight = originalHeight + "px";
                appView.style.overflowY = "auto";
              } else {
                // 键盘收起
                appView.style.minHeight = "100vh";
              }
            });
          },
        },
      });
    </script>
  </body>
</html>
