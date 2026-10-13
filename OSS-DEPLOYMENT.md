# 阿里云 OSS 部署说明

## 项目结论

本项目是纯 HTML/CSS/JavaScript 静态站点，没有 `package.json`，不需要安装依赖或执行构建命令。部署产物就是以下仓库文件：

- `index.html`
- `about.html`
- `services.html`
- `404.html`
- `robots.txt`
- `assets/`

GitHub Actions 会把这些文件复制到临时 `dist/` 目录，再同步到 OSS；`.git`、工作流和部署说明不会被上传。

## 推荐架构

`访客 -> 已备案自定义域名 -> 阿里云 CDN（HTTPS） -> OSS 公共读静态网站 Bucket`

这是一只专门存放公开网站文件的 Bucket，不要在其中存放源码、AccessKey、客户资料或其他敏感数据。

如果主要访问者在中国大陆，推荐选择与主要用户或其他阿里云资源最接近的中国内地地域。没有更具体的地域要求时，可选择华东 1（杭州，`cn-hangzhou`）；华东用户也可选上海，华南用户可选深圳。Bucket 创建后地域不能直接修改。使用 CDN 后，源站地域对全国访问延迟的影响会降低。

## 一次性创建和配置

1. 在 OSS 控制台创建一个全局唯一名称的 Bucket。
   - 地域：推荐 `cn-hangzhou`，或按主要用户位置选择。
   - 存储类型：标准存储。
   - 读写权限：先保持私有。
   - 版本控制：建议开启，便于误覆盖或误删除后回滚。
2. 上传站点文件，或者先完成下方 GitHub Actions 配置并手动运行一次工作流。
3. 在 Bucket 的“数据管理/静态页面”中开启静态网站托管：
   - 默认首页：`index.html`
   - 默认 404 页：`404.html`
   - 404 HTTP 状态码：`404`
4. 对这只专用网站 Bucket 关闭“阻止公共访问”，再将 Bucket ACL 设置为“公共读”。不要设置为“公共读写”。
5. 在 Bucket 的“域名管理”中绑定自定义域名。中国内地 Bucket 的自定义域名需要完成 ICP 备案。
6. 推荐在 CDN 控制台添加该自定义域名：
   - 加速区域：中国内地（域名必须已备案）。
   - 业务类型：图片小文件。
   - 源站：当前 OSS Bucket 的外网域名。
   - DNS：把自定义域名 CNAME 到 CDN 分配的 CNAME。
7. 在 CDN 的 HTTPS 配置中部署匹配域名的证书，开启 HTTP -> HTTPS 的 301 跳转；确认所有相关子域名都支持 HTTPS 后，再考虑开启 HSTS。
8. CDN 缓存建议：
   - `*.html`、`robots.txt`、404 响应：不缓存或 0 秒，并回源校验。
   - `*.svg`、`*.png`、`*.jpg`：1 天。本项目资源名没有内容哈希，暂不建议永久缓存。
   - 404 状态码：0 秒，避免错误页面长期滞留在节点。

也可不使用 CDN，直接把自定义域名 CNAME 到 Bucket 外网域名，并在 OSS 域名管理中托管 SSL 证书。直接接入 OSS 时没有 CDN 的 HTTP -> HTTPS 跳转能力；如需只允许 HTTPS，可用 Bucket Policy 拒绝非安全传输请求。

## 用 ossutil 配置首页和 404

仓库中的 `deploy/website-configuration.json` 可用于一次性配置静态网站。执行前请在本机通过环境变量配置 RAM 用户凭证，不要把凭证写入仓库或命令历史：

```bash
export OSS_ACCESS_KEY_ID="从安全位置读取"
export OSS_ACCESS_KEY_SECRET="从安全位置读取"
export OSS_REGION="cn-hangzhou"

ossutil api put-bucket-website \
  --bucket "你的-bucket-名称" \
  --website-configuration file://deploy/website-configuration.json
```

Bucket ACL 和“阻止公共访问”建议在控制台中显式确认，避免脚本误改其他 Bucket 的访问边界。

## GitHub Actions 自动部署

1. 在 RAM 控制台创建一个只用于 GitHub Actions 的 RAM 用户，不要使用阿里云主账号 AccessKey。
2. 复制 `deploy/ram-policy.example.json`，将其中两处 `<bucket-name>` 替换为实际 Bucket 名称，并把该自定义策略授予 RAM 用户。该策略只允许列举、上传和删除这一只 Bucket 中的对象。
3. 在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 中添加：

   Secrets（凭证）：

   - `OSS_ACCESS_KEY_ID`
   - `OSS_ACCESS_KEY_SECRET`

   Variables（普通配置）：

   - `OSS_BUCKET`：Bucket 名称，不带 `oss://`
   - `OSS_REGION`：例如 `cn-hangzhou`
   - `SITE_URL`：可选，例如 `https://www.example.com`；配置后部署会检查首页和 404。
   - `DEPLOY_ENABLED`：完成密钥轮换和 Bucket 配置后设为 `true`；未设置时工作流不会部署。

4. 合并 `.github/workflows/deploy-oss.yml` 到 `main`。以后修改站点文件并推送到 `main` 会自动部署，也可以在 Actions 页面手动运行。

工作流使用固定版本的官方 ossutil 2.4.0 并校验 SHA-256；凭证只通过 GitHub Secrets 注入环境变量，不会写入配置文件或命令参数。同步使用 `--delete` 保持 Bucket 与发布目录一致，因此这只 Bucket 不应混放其他文件。版本控制可为误删除提供恢复能力。

## 私有 Bucket + CDN 备选方案

若必须避免 OSS 源站被匿名直连，可保持 Bucket 私有，并在 CDN 中开启“OSS 私有 Bucket 回源（同账号）”。需要注意：CDN 私有回源会带签名，而 OSS 默认首页只对匿名根路径请求生效。因此必须在 CDN 增加根路径规则，把 `^/$` 重定向或改写到 `/index.html`，并在 CDN 层配置 404 页面；否则访问根路径可能返回 403。对这个简单公开站点，优先采用上面的专用公共读 Bucket 方案。

## 上线检查

```bash
curl -I https://你的域名/
curl -I https://你的域名/index.html
curl -I https://你的域名/assets/favicon.svg
curl -I https://你的域名/definitely-not-found
```

期望：首页返回 `200`，不存在路径返回 `404`，HTTP 地址跳转到 HTTPS，HTML 响应不长期缓存，静态图片带有一天左右的缓存策略。

正式域名确定后，还应在页面补充 canonical URL、`og:url` 和 `sitemap.xml`。
