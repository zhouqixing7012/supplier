# 移动端图片素材来源

- `portal-city.png`：根据用户提供的 `Screenshot_20261014_203223_com.sohu.ehr.jpg`，使用内置 imagegen 还原无表单和水印的蓝色城市背景。生成提示见下文。
- `logo-source.jpg`：同一用户截图，页面仅显示黄色搜狐标识区域。
- `capture-notice-source.jpg`：用户提供的 `Screenshot_20261014_194640_com.sohu.ehr.jpg`。页面只显示其中截屏提醒插画区域。
- `bank-proof-source.jpg`：用户提供的 `Screenshot_20261014_194652_com.sohu.ehr.jpg`。页面只显示其中开户证明缩略图区域。
- `license-source.jpg`：用户提供的 `Screenshot_20261014_200421_com.sohu.ehr.jpg`。页面只显示其中营业执照缩略图区域。
- `empty-application-source.jpg`：用户提供的 `Screenshot_20261014_201642_com.sohu.ehr.jpg`。页面只显示其中空状态插画区域。
- `noto-sans-sc-400.woff2`：Fontsource 的 Noto Sans SC 简体中文 400 字重，许可证保留在 `NotoSansSC-LICENSE.txt`。

## 城市背景生成提示

Use case: precise-object-edit. Project asset: clean portrait background photograph for faithfully reproducing this supplier mobile login screenshot in HTML. Edit target is the supplied screenshot. Return ONLY the existing blue nighttime city/buildings photograph filling the portrait image (aspect 9:19), reconstructing the photograph behind UI. Remove every UI element: white phone status/header/nav areas, yellow Sohu rectangle logo, all Chinese and English text and labels, all form fields, captcha, orange and green buttons, and ALL faint employee-name watermarks. Preserve the photograph's exact architecture, saturated deep cobalt sky, lights, angle, composition and crop: main glass building sweeps diagonally upward left-to-right in the foreground, tall lit office at right, small city buildings in upper left. No new skyline, no embellishment, no words, no logos, no watermark. Extend the sky/buildings into areas formerly occupied by controls. This is faithful asset restoration, not redesign.
