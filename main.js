(() => {
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav');
  if(menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.textContent = open ? '×' : '☰';
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.textContent = '☰'; }));
  }
  const filters = document.querySelectorAll('[data-filter]');
  if(filters.length) {
    filters.forEach(btn => btn.addEventListener('click', () => {
      const active = btn.getAttribute('data-filter');
      filters.forEach(other => other.setAttribute('aria-pressed', String(btn === other)));
      document.querySelectorAll('[data-category]').forEach(card => {card.classList.toggle('hidden', active !== 'all' && !(card.dataset.category || '').split(' ').includes(active));});
    }));
    const hash = window.location.hash;
    if(hash && document.querySelector(hash)) setTimeout(()=>document.querySelector(hash).scrollIntoView({block:'start',behavior:'smooth'}), 150);
  }
  const scenarios = {
    service: {name:'全渠道客服协作', desc:'来自 AI Agent 配置和智能客服工作台经验的通用工作流示意。', nodes:[['客户提出需求','聊天 / 邮件 / 社媒'],['理解并调取信息','知识库 + 订单数据'],['调用业务工具','MCP / API / 规则'],['人机协同处理','低风险自动答，高风险人工确认'],['记录与持续优化','复盘未解决问题']],outcome:'成果定义：更少重复查询、更可追溯的解决过程、更容易交接的客服知识。'},
    research: {name:'AI 原生研发协作', desc:'来自 Compo.Dev 和 QuickCEP 研发流程经验的通用工作流示意。',nodes:[['需求变为任务','PRD 解析 / 拆分'],['设计进入代码','设计稿 / Codegen'],['隔离环境验证','预览沙箱 / Worktree'],['自动质量检查','测试 / 类型 / 评审'],['交付与经验沉淀','PR / 规范 / Memory']],outcome:'成果定义：需求到代码路径可追踪，错误有反馈，重复经验可复用。'},
    operation: {name:'运营任务数字化', desc:'基于运营活动、内部工具与业务系统研发经历提炼的示意流程。',nodes:[['收集业务数据','运营目标 / 数据源'],['标准化处理','规则校验 / 分类'],['形成工作任务','优先级 / 触发条件'],['执行与审核','系统动作 + 人工确认'],['反馈到资产','报表 / SOP / 复盘']],outcome:'成果定义：减少手动搬运，让流程留痕、结果可核对、下一次能复用。'}
  };
  const tabButtons = document.querySelectorAll('[data-workflow]');
  if(tabButtons.length) {
    const render = key => { const s=scenarios[key]; if(!s)return; document.getElementById('workflow-title').textContent=s.name; document.getElementById('workflow-desc').textContent=s.desc; document.getElementById('workflow-nodes').innerHTML=s.nodes.map((n,i)=>`<div class="workflow-node"><span class="dot"></span><strong>${String(i+1).padStart(2,'0')}. ${n[0]}</strong><small>${n[1]}</small></div>`).join(''); document.getElementById('workflow-outcome').textContent=s.outcome;tabButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workflow===key)));};
    tabButtons.forEach(b=>b.addEventListener('click',()=>render(b.dataset.workflow)));
    render('service');
  }
})();

// Copy the owner's confirmed WeChat ID with a fallback for older browsers.
document.querySelectorAll('[data-copy-wechat]').forEach(button => {
  button.addEventListener('click', async () => {
    const value = 'anyijuneasy';
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = '已复制';
    } catch (error) {
      const input = document.createElement('input');
      input.value = value;
      document.body.appendChild(input);
      input.select();
      const done = document.execCommand('copy');
      input.remove();
      button.textContent = done ? '已复制' : '请手动复制';
    }
  });
});

// Keep the main CTA focused on the quickest first contact: WeChat.
document.querySelectorAll('.header-cta').forEach(link => {
  const onHomepage = /\/index\.html$/.test(window.location.pathname);
  link.href = onHomepage ? '#contact' : 'index.html#contact';
  link.setAttribute('aria-label', '前往首页底部联系方式，添加微信');
});

document.querySelectorAll('.cases-page .cta-section .btn-accent').forEach(link => {
  link.href = 'index.html#contact';
  link.setAttribute('aria-label', '前往首页底部联系方式，添加微信');
});

document.querySelectorAll('.services-page .contact-card a[href*="subject="]').forEach(link => {
  link.href = 'index.html#contact';
  link.setAttribute('aria-label', '前往首页底部联系方式，添加微信');
});

document.querySelectorAll('.services-page .cta-section .btn-accent').forEach(link => {
  link.href = 'index.html#contact';
  link.setAttribute('aria-label', '前往首页底部联系方式，添加微信');
});
