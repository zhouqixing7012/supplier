# CONTEXT

当前：供应商协同门户 React 原型已整体重做为 shadcn/ui 风格。

关键决定：
- 移除 Ant Design 运行依赖，使用 shadcn 组件源码模式 + Sonner Toast。
- 登录页改为现代双栏布局，保留搜狐供应商门户品牌感；页面仅展示真实用户会看到的内容。
- `noemail`：登录页使用橙色 Warning Toast 提示补充注册邮箱，不跳转说明页。
- `oldpwd`：使用 Warning Toast 提示先修改密码，并进入修改密码页。
- 其他账号：进入注册邮箱 + 邮箱验证码校验页。

位置：React/Vite/Tailwind/shadcn 原型代码已更新到 main，可继续用于 Vercel 自动部署。
