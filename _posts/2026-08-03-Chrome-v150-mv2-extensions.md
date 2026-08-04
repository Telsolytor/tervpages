---
layout: post
title: "关于Chrome中的ManifestV2扩展的问题"
subtitle: "万恶的咕噜咕噜还我uBO来"
date: 2026-08-03 22:49:00 +0800
categories: tech
tags:
  - Chrome 
---

## 废话

自Chrome 127以来，Google就一直在强推ManifestV3扩展；到了后续版本更是开始主动禁用、禁止启用等方法强推。日常受影响最严重之一的便是广告拦截神器**uBlock Origin**了。截至150版本，主流给MV2扩展续命方案便是通过Chrome Policy/Flag 重新启用。我将互联网上各个版本Chrome常见的处理方式整理了一下。

更新：151及以上版本已无法使用MV2扩展[^7]

## 续命方案

### Chrome 138 以下版本

将下列内容保存为`ExtensionManifestV2Availability.reg`，双击导入注册表

```reg
Windows Registry Editor Version 5.00
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome]
"ExtensionManifestV2Availability"=dword:00000002
```

导入后，**在Chrome地址栏中输入**`chrome://policy`回车进入。点击 **Reload policies(重新加载政策)** 按钮。

### Chrome 138/139 版本

Chrome地址栏输入`chrome://flags`，搜索`temporary-unexpire-flags-m137`，将状态改为**Enabled**，单击底部横幅提示`重启浏览器`后进行接下来的步骤。

继续打开`chrome://flags`，分别搜索下列flag并更改状态为**Disabled**：

- `extension-manifest-v2-deprecation-warning`  
- `extension-manifest-v2-deprecation-disabled`  
- `extension-manifest-v2-deprecation-unsupported`
 
 搜索下列flag，更改状态为**Enabled**：

- `allow-legacy-mv2-extensions`

最后重新启动浏览器。

### Chrome 140-150 版本

由于`temporary-unexpire-flags-m{$recent_mstones}`仅支持当前版本Chrome**前2个版本**的临时启用，上述办法在140及后续版本中失效。  
但由于在Chrome中，每一个Flag都对应一个Feature[^1]，并具有[映射关系](https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/about_flags.cc)。我们仍然可以通过添加启动参数的方法来强行启用MV2的支持：

```
 --disable-features=ExtensionManifestV2Unsupported,ExtensionManifestV2Disabled
```

对于 Windows 用户，按下列方式操作：

1. 找到你的Chrome**快捷方式**，右键-属性
2. 切换到`快捷方式`Tab，在`目标`一栏的**末尾追加**上述启动参数。应用并重新**从快捷方式打开Chrome**

> warning ""
> 启动参数与目标位置之间应有一个空格

实操例子如下：

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-features=ExtensionManifestV2Unsupported,ExtensionManifestV2Disabled
```

> warning ""
> 不要复制粘贴！每个人的环境可能存在不同！  
> 必须从快捷方式启动才能带有启动参数，从其他位置启动Chrome无效！

#### Chrome启动参数方法失效的问题

在日常使用中发现，即使从附带了参数的快捷方式启动Chrome，uBO（MV2扩展）仍然被禁用的问题。搜索了一下发现了两种办法：

1. 通过DevTools删去启用按钮的Disabled标签[^8]
2. 为computeMv2DeprecatedExtensions_()函数添加断点[^9]

这些文章中均有用户表示可行，但我这边因为蜜汁原因，方法都无效。向AI资讯了一些其他可能性方案也无果。

至于为啥扩展被自动禁用，推测原因也许是在使用期间有从其他位置启动Chrome，导致Chrome不包含关闭MV2停用的启动参数自动禁用了扩展。

在这里写一下我最终的解决方案：

1. 打开uBO的官方[Release](https://github.com/gorhill/uBlock/releases)
2. 下载**uBlock0_x.xx.x.chromium.zip**，解压到一个你记得住的位置。
3. 打开`chrome://extensions/`，右上角打开开发者模式。
4. 点击`Load unpacked（加载已解压的扩展程序）`，选择你解压uBO得到的文件夹。

> info "Tips"
> - 解压得到的文件夹不可删除
> - 加载已解压的扩展程序时，必须选择包含了**manifest.json**文件的文件夹。否则可能报错【清单文件缺失或不可读取】
> - 仍然需要按前文所述方法启用对MV2扩展的支持

## 禁用自动更新

我是一路从129版本升上来的Chrome，~~目前150版本后也不清楚对MV2扩展支持如何，但建议还是禁止Chrome的自动更新比较稳妥。毕竟我们无法估计Google会在哪个版本中完全移除对MV2扩展的支持。~~更新：在151及以上版本已无法使用MV2扩展[^7]  
下列方法任选其一即可。

### Hosts 禁用

> warning ""
> 此方法可能导致Chrome部分功能失效

用文本编辑器打开你所使用操作系统的的Hosts文件，以Windows为例：

```
C:\Windows\System32\drivers\etc\hosts
```

在打开的文本末尾追加此行：

```
127.0.0.1 update.googleapis.com 
```

如果以后不需要禁止，删去添加的这行或在其前添加#号注释掉即可。

### 使用注册表禁用更新

1. 打开注册表编辑器
2. 导航到`HKEY_LOCAL_MACHINE\SOFTWARE\Policies`  
3. 右键`Policies`-新建-**项**-命名为`Google`  
4. 右键`Google`-新建-**项**-命名为`Update`  
5. 在右侧面板中，右键-新建DWORD（32位）值，命名为`UpdateDefault`  
6. 双击UpdateDefault，将值设置为下列之一：  
   - 0 禁用更新
   - 1 启用更新
   - 2 仅手动更新
   - 3 仅自动更新
7. 设置完成后，重启Chrome

### 使用管理模板安装和指定 Google 更新政策[^2]

作为 Microsoft Windows 管理员，你可以使用 Google 更新为用户管理 Chrome 浏览器和 Chrome 应用的更新方式，并可通过组策略管理编辑器来管理 Google 更新设置。

> info "Tips"
> 也可以访问Google官方的文档页，获取更精细控制Google Chrome更新的方法。[^2]

#### 获取Google更新政策模板

1. 下载并解压缩[基于 XML 的管理模板 (ADMX)](https://dl.google.com/update2/enterprise/googleupdateadmx.zip)。
2. 打开 **GoogleUpdateAdmx** 文件夹。
3. 将 **google.admx** 和 **GoogleUpdate.admx** 复制到 **Policy Definitions**（策略定义）文件夹（例如：`C:\Windows\PolicyDefinitions`）。
4. 将 `GoogleUpdateAdmx/en-US` 文件夹中的 **google.adml** 和 **GoogleUpdate.adml** 文件复制到 Policy Definitions（策略定义）文件夹下的 **en-US 文件夹**（例如：`C:\Windows\PolicyDefinitions\en-US`）。
   
   >warning ""
   >如果你已经通过 为受管理的 PC 设置 Chrome 浏览器政策[^3] 安装了更完整版本（大小更大）的**Google.admx / Google.adml**，那么我不建议你将其替换上述步骤中提供的版本

5. 打开组策略，然后转到**计算机配置-策略-管理模板-Google-Google Update，验证模板是否已正常加载。

#### 停用 Chrome 浏览器更新

> note ""
> 如果你需要停止 Chrome 浏览器更新，可以停用自动更新功能，并禁止用户自行手动更新浏览器。 即使你停用更新功能，Google 更新仍会继续检查是否有新的更新。

1. 打开组策略
2. 依次点击`Google-Google Update-Applications-Google Chrome`
3. 右侧打开**Update policy override**项
4. 配置为**已启用**，在选项Policy中选择**Updates disabled**
5. 重启浏览器

完成上述步骤后，在`chrome://settings/help`页面，你应该会看到一条提示，告知你管理员已停用更新功能。

## 替代品：拥抱 MV3，还是换个平台？

虽然通过一些方式可以让 MV2 扩展暂时继续运行，但从长期来看，一直退居旧版本Chrome也将缺失不少的功能与安全更新。  
毕竟，Chrome 的方向已经非常明确：MV3 才是未来。  
因此，对于仍然依赖扩展功能的用户来说，寻找替代方案也是一个现实选择。

### Microsoft Edge

作为 Windows 10/11 默认推广的浏览器，Microsoft Edge 近年来凭借 Chromium 内核、系统整合以及性能优化，逐渐扩大了市场份额。  
根据 StatCounter 的数据，截至 2023 年 2 月，Microsoft Edge 已成为全球第三大桌面浏览器，仅次于 Safari 和 Chrome；而到了 2025 年 1 月，Edge 在 PC/桌面浏览器市场进一步提升，超过 Safari，成为全球第二大桌面浏览器。[^4]  
由于 Edge 同样基于 Chromium，因此它与 Chrome 在扩展生态方面高度兼容，这也意味着它同样面临 Manifest V2 向 Manifest V3 迁移的问题。  不过，截至本文发布时，微软对于 MV2 扩展的最终处理方案仍然处于 TBD（待定） 状态。[^5]  
理论上，作为 Chromium 阵营中 Chrome 的主要竞争者之一，微软可能会选择保留更长时间的 MV2 支持，以此吸引那些依赖传统扩展生态的用户。毕竟，对于浏览器厂商来说，扩展生态本身就是竞争力的一部分。  
但另一方面，Edge 的底层仍然依赖 Chromium，而 Chromium 的发展方向主要由 Google 主导。微软究竟会选择保持差异化，还是最终跟随 Chromium 主线推进 MV3，目前仍然没有明确答案。

对于 MV2 用户而言，Edge 也许会成为一个缓冲选择，但是否能够成为长期避风港，很难评判。

### Firefox

[Mozilla Firefox](https://www.firefox.com)，通称火狐（Firefox），是由Mozilla基金会及其子公司Mozilla公司开发的自由开源网页浏览器。该浏览器采用Gecko排版引擎解析网页内容，完全支持现行及前瞻性网络标准。随着Google Chrome崛起，Firefox日渐式微。截至2026年8月，据StatCounter统计，Firefox的市场占有率仅剩3.34%。

如果说 Chromium 阵营正在逐渐向 Manifest V3 过渡，那么 Firefox 则选择了另一条路线。它不基于Chromium，这也意味着，它不会被 Chromium 的扩展政策完全绑定。Firefox官方也明确表示将继续支持 MV2 扩展。[^6]

### uBlock Origin Lite

[uBlock Origin Lite (uBOL)](https://github.com/uBlockOrigin/uBOL-home) 是 uBO 的精简版，它尽力将 uBO 使用的过滤器列表转换为符合 Manifest v3 标准的方法，并像 uBO 自 2014 年 6 月首次发布以来一样，注重可靠性和效率。  
然而，在 Manifest v3 环境中，对可靠性和效率的关注意味着不得不牺牲许多功能，而这些功能在 Manifest v3 框架内是无法实现的。

有关 uBOL 与 uBO 的比较详情，请参阅[uBOL 官方常见问题解答网页](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ))。

[^1]: 感谢 [这篇文章](https://midbai.com/post/chrome-139-later-enable-manifest-v2/#%e4%bd%bf%e7%94%a8%e5%91%bd%e4%bb%a4%e8%a1%8c%e6%9d%a5%e5%90%af%e7%94%a8manifest-v2%e7%9a%84%e6%94%af%e6%8c%81) 提供的消息！
[^2]: [管理 Chrome 更新 (Windows)](https://support.google.com/chrome/a/answer/6350036?hl=zh-Hans)
[^3]: [为受管理的 PC 设置 Chrome 浏览器政策](https://support.google.com/chrome/a/answer/187202?hl=zh-Hans#zippy=%2Cwindows)
[^4]: [Microsoft Edge - Wikipedia](https://en.wikipedia.org/w/index.php?title=Microsoft_Edge&oldid=1367171564)
[^5]: [Overview and timelines for migrating to Manifest V3](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/manifest-v3)
[^6]: [Manifest V3 & Manifest V2 (March 2024 update)](https://blog.mozilla.org/addons/2024/03/13/manifest-v3-manifest-v2-march-2024-update/)
[^7]: [此方法适用于 Chrome 150 的最新版本 150.0.7871.187](https://ry.huaji.store/2026/01/Chrome-manifest-v2/)
[^8]: [Chrome 150 版本启用 Manifest V2 的方法](https://fast.v2ex.com/t/1224327)
[^9]: [ 在Chrome150上重新启用已安装的MV2扩展 ](https://meta.appinn.net/t/topic/88296)