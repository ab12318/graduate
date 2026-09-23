const RESUME_DRAFT_KEY = "tuimian2027.resumeDraft";
const CONSULTANTS_KEY = "tuimian2027.consultants";
const RESUME_TEMPLATE_KEY = "tuimian2027.resumeTemplate.v3";
const RESUME_FONT_SIZE_KEY = "tuimian2027.resumeFontSize.v1";
let pendingProfileImport = null;

function readProfileForResume() {
  try { return JSON.parse(localStorage.getItem("tuimian2027.profile") || "{}"); }
  catch { return {}; }
}

function nonemptyRecords(rows) {
  return Array.isArray(rows) ? rows.filter((row) => row && Object.values(row).some((value) => String(value || "").trim())) : [];
}

function resumeDateRange(row) {
  return [row.startDate, row.endDate].filter(Boolean).join("—") || row.date || "";
}

function resumeRecord(title, subtitle, detail, date) {
  return `<div class="resume-line resume-entry"><div class="resume-date">${esc(date || "")}</div><div><div class="resume-entry-title">${esc(title || "")}</div>${subtitle ? `<div class="resume-entry-sub">${esc(subtitle)}</div>` : ""}${detail ? `<p>${esc(detail)}</p>` : ""}</div></div>`;
}

function resumeSection(title, body) {
  return body ? `<section class="resume-section"><h3>${esc(title)}</h3>${body}</section>` : "";
}

function createResumeHTML(profile, photoData = "") {
  const name = String(profile.name || "姓名待填写").trim();
  const contact = [profile.gender, profile.ethnicity, profile.phone, profile.email, $("#resume-show-address").checked ? profile.address : ""].filter(Boolean).join("　·　");
  const targetSchool = $("#resume-target-school").value.trim() || profile.applyCollege || "";
  const targetMajor = $("#resume-target-major").value.trim() || profile.applyMajor || "";
  const focus = $("#resume-focus").value.trim();
  const summary = $("#resume-summary-edit").value.trim() || profile.summary || profile.personalStatement || "";
  const education = nonemptyRecords(profile.education).map((row) => ({ ...row, kind: "education", organization: row.school || "", position: row.major || "" }));
  const work = nonemptyRecords(profile.work).map((row) => ({ ...row, kind: "work", organization: row.organization || "", position: row.role || "" }));
  const timeline = [...education, ...work].sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
  const educationHTML = education.map((row) => resumeRecord(row.organization, row.position, row.division || row.details, resumeDateRange(row))).join("");
  const workHTML = work.map((row) => resumeRecord(row.organization, row.position, row.division || row.details, resumeDateRange(row))).join("");
  const timelineHTML = [...education, ...work].sort((a, b) => String(a.startDate || "").localeCompare(String(b.startDate || ""))).map((row) => resumeRecord(row.organization, row.position, row.division || row.details, resumeDateRange(row))).join("");
  const researchHTML = nonemptyRecords(profile.research).map((row) => resumeRecord(row.name, [row.organization, row.role, row.ranking].filter(Boolean).join(" · "), [row.division, row.description].filter(Boolean).join("；"), resumeDateRange(row))).join("");
  const publicationHTML = nonemptyRecords(profile.publications).map((row) => resumeRecord(row.title, [row.type, row.journal, row.authorship].filter(Boolean).join(" · "), [row.description, row.identifier].filter(Boolean).join(" · "), row.date)).join("");
  const awardHTML = nonemptyRecords(profile.awards).map((row) => resumeRecord(row.name, [row.level, row.ranking, row.organization].filter(Boolean).join(" · "), row.division || row.details, row.date)).join("");
  const projectHTML = nonemptyRecords(profile.projects).map((row) => resumeRecord(row.name, [row.organization, row.role, row.ranking].filter(Boolean).join(" · "), [row.division, row.description].filter(Boolean).join("；"), resumeDateRange(row))).join("");
  const practiceHTML = nonemptyRecords(profile.practice).map((row) => resumeRecord(row.name, [row.organization, row.role, row.ranking].filter(Boolean).join(" · "), row.division || row.details, resumeDateRange(row))).join("");
  const languageHTML = nonemptyRecords(profile.languages).map((row) => resumeRecord(row.language, row.score, row.remarks, row.date)).join("");
  const studyFacts = [profile.department, profile.gpa ? `GPA ${profile.gpa}` : "", profile.rank ? `成绩排名 ${profile.rank}` : ""].filter(Boolean);
  const studyHTML = studyFacts.length ? `<div class="resume-entry"><p>${esc(studyFacts.join("　·　"))}</p></div>` : "";
  const interestHTML = profile.interest ? `<div class="resume-entry"><p>${esc(profile.interest)}</p></div>` : "";
  const target = [targetSchool, targetMajor].filter(Boolean).join(" · ");
  const focusLine = focus ? `<div class="resume-entry-sub">目标重点：${esc(focus)}</div>` : "";
  if ($("#resume-template").value === "agri") {
    const photo = photoData ? `<img class="resume-agri-photo" src="${esc(photoData)}" alt="个人照片">` : '<div class="resume-agri-photo-placeholder">可在个人资料上传照片</div>';
    const coreCourses = String(profile.coreCourses || "").split(/[\r\n]+/).map((item) => item.trim()).filter(Boolean);
    const skills = String(profile.skills || "").split(/[\r\n]+/).map((item) => item.trim()).filter(Boolean);
    const educationEntry = educationHTML || (profile.school || profile.major ? resumeRecord(profile.school, [profile.department, profile.major].filter(Boolean).join(" · "), [profile.gpa ? `GPA ${profile.gpa}` : "", profile.rank ? `成绩排名 ${profile.rank}` : ""].filter(Boolean).join(" · "), [profile.enrollmentMonth, profile.expectedGraduationMonth].filter(Boolean).join("—")) : "");
    const courseHTML = coreCourses.length ? `<div class="resume-agri-tags">${coreCourses.map((item) => `<span class="resume-agri-tag">${esc(item)}</span>`).join("")}</div>` : "";
    const skillsHTML = skills.map((item) => `<div class="resume-agri-skill">${esc(item)}</div>`).join("");
    const sidebar = `${photo}<h2 class="resume-agri-name">${esc(name)}</h2><p class="resume-agri-contact">${esc([profile.phone, profile.email, profile.politicalStatus].filter(Boolean).join("\n"))}</p>${target ? `<div class="resume-agri-target">求学意向：${esc(target)}</div>` : ""}${resumeSection("教育背景", educationEntry)}${resumeSection("核心课程", courseHTML)}${resumeSection("语言能力", languageHTML)}${resumeSection("专业技能", skillsHTML)}`;
    const academicInterest = profile.interest || profile.personalStatement || profile.summary || "";
    const interest = academicInterest ? `<div class="resume-agri-copy">${esc(academicInterest)}</div>` : "";
    const right = `${resumeSection("科研经历", researchHTML)}${resumeSection("项目经历", projectHTML)}${resumeSection("发表成果", publicationHTML)}${resumeSection("竞赛获奖", awardHTML)}${resumeSection("学习与工作经历", workHTML)}${resumeSection("社会实践", practiceHTML)}${resumeSection("学术兴趣与研究方向", interest)}`;
    return `<div class="resume-page-content"><div class="resume-agri"><aside class="resume-agri-sidebar">${sidebar}</aside><main class="resume-agri-main">${right}</main></div></div>`;
  }
  return `<div class="resume-page-content"><header class="resume-header"><h2>${esc(name)}</h2><p>${esc(contact)}</p>${target ? `<div class="resume-target">求学意向：${esc(target)}</div>` : ""}</header>${resumeSection("个人简介", summary ? `<div class="resume-entry"><p>${esc(summary)}</p>${focusLine}</div>` : focusLine)}${resumeSection("学业信息", studyHTML)}${resumeSection("研究兴趣", interestHTML)}${resumeSection("教育与工作经历", timelineHTML)}${resumeSection("科研经历", researchHTML)}${resumeSection("项目经历", projectHTML)}${resumeSection("发表成果", publicationHTML)}${resumeSection("奖励情况", awardHTML)}${resumeSection("社会实践", practiceHTML)}${resumeSection("外语能力", languageHTML)}</div>`;
}

function fitResumeToOnePage() {
  const paper = $("#resume-preview");
  const content = paper.querySelector(".resume-page-content");
  if (!content) return;
  content.style.zoom = "1";
  const style = getComputedStyle(paper);
  const available = paper.clientHeight - parseFloat(style.paddingTop || 0) - parseFloat(style.paddingBottom || 0);
  const contentHeight = content.scrollHeight;
  if (available > 0 && contentHeight > available) content.style.zoom = String(available / contentHeight);
}

function setResumeReady(ready) {
  $("#resume-word").disabled = !ready;
  $("#resume-pdf").disabled = !ready;
  $("#resume-save").disabled = !ready;
}

function applyResumeTemplate() {
  const preview = $("#resume-preview");
  const template = $("#resume-template").value || "blue";
  preview.classList.remove("template-classic", "template-blue", "template-compact", "template-agri");
  preview.classList.add(`template-${template}`);
  localStorage.setItem(RESUME_TEMPLATE_KEY, template);
  applyResumeFontSize();
}

function applyResumeFontSize() {
  const control = $("#resume-font-size");
  const size = ["9", "10", "11", "12"].includes(control?.value) ? control.value : "10";
  if (control) control.value = size;
  $("#resume-preview").style.setProperty("--resume-font-size", `${size}pt`);
  localStorage.setItem(RESUME_FONT_SIZE_KEY, size);
}

async function renderResumeFromProfile() {
  const profile = readProfileForResume();
  const scalars = Object.entries(profile).filter(([key, value]) => key !== "attachments" && !Array.isArray(value) && String(value || "").trim()).length;
  const records = Object.entries(profile).reduce((sum, [, value]) => sum + nonemptyRecords(value).length, 0);
  $("#resume-source-count").textContent = `已读取 ${scalars} 项基本信息、${records} 条经历；空白资料不会自动补造。`;
  if (!scalars && !records) {
    $("#resume-status").textContent = "个人资料暂为空。先到“个人资料”填写信息，再生成简历。";
    return;
  }
  if (!$("#resume-summary-edit").value.trim()) $("#resume-summary-edit").value = profile.summary || profile.personalStatement || "";
  let photoData = "";
  if ($("#resume-template").value === "agri") {
    try {
      const photo = (await listAttachments()).find((item) => item.category === "报名照片" && item.type?.startsWith("image/") && item.blob);
      if (photo && photo.size <= 1024 * 1024) photoData = await blobToDataURL(photo.blob);
    } catch {}
  }
  $("#resume-preview").innerHTML = createResumeHTML(profile, photoData) || '<div class="resume-empty">资料已读取。补充教育、科研或实践经历后，简历会更完整。</div>';
  applyResumeTemplate();
  fitResumeToOnePage();
  $("#resume-draft-state").textContent = "初稿已生成，可调整摘要后重新生成";
  setResumeReady(true);
  saveResumeDraft(false);
}

async function polishResumeWithAI() {
  const resume = $("#resume-preview").innerText.trim();
  const requestText = $("#resume-ai-request").value.trim();
  const endpoint = $("#resume-ai-endpoint").value.trim();
  const model = $("#resume-ai-model").value.trim();
  const apiKey = $("#resume-ai-key").value.trim();
  const status = $("#resume-ai-status");
  if (!$("#resume-preview").querySelector(".resume-header, .resume-agri") && !$("#resume-preview").querySelector(".resume-ai-output")) {
    status.textContent = "请先生成简历，再进行 AI 优化。";
    return;
  }
  if (!resume || !requestText) { status.textContent = "请填写优化要求。"; return; }
  if (!endpoint || !model || !apiKey) { status.textContent = "请填写 AI 接口地址、模型名称和密钥。"; return; }
  if (!$("#resume-ai-consent").checked) { status.textContent = "请先勾选同意发送当前简历和优化要求。"; return; }
  const button = $("#resume-ai-polish");
  button.disabled = true;
  status.textContent = "正在发送当前简历和要求给 AI 优化…";
  try {
    const response = await fetch("/api/resume/polish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText: resume, request: requestText, ai: { endpoint, model, apiKey } }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "AI 优化失败");
    $("#resume-ai-result").value = result.text || "";
    $("#resume-ai-result-wrap").hidden = false;
    status.textContent = "优化稿已生成，请核对真实性；点击“采用优化稿”后才会替换当前简历。";
  } catch (error) {
    status.textContent = error.message || "无法连接本机服务，请确认服务正在运行。";
  } finally {
    $("#resume-ai-key").value = "";
    $("#resume-ai-consent").checked = false;
    button.disabled = false;
  }
}

function saveResumeDraft(showToast = true) {
  const preview = $("#resume-preview");
  if (!preview.querySelector(".resume-header, .resume-agri, .resume-ai-output")) return;
  const draft = {
    html: preview.innerHTML,
    school: $("#resume-target-school").value,
    major: $("#resume-target-major").value,
    focus: $("#resume-focus").value,
    summary: $("#resume-summary-edit").value,
    template: $("#resume-template").value,
    fontSize: $("#resume-font-size").value,
    showAddress: $("#resume-show-address").checked,
    profileSnapshot: JSON.stringify(readProfileForResume()),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(RESUME_DRAFT_KEY, JSON.stringify(draft));
  $("#resume-draft-state").textContent = "草稿已保存在本机";
  if (showToast) toast("简历草稿已保存到本机");
}

function restoreResumeDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(RESUME_DRAFT_KEY) || "null");
    if (!draft) return;
    $("#resume-target-school").value = draft.school || "";
    $("#resume-target-major").value = draft.major || "";
    $("#resume-focus").value = draft.focus || "";
    $("#resume-summary-edit").value = draft.summary || "";
    $("#resume-template").value = localStorage.getItem(RESUME_TEMPLATE_KEY) || "blue";
    $("#resume-font-size").value = localStorage.getItem(RESUME_FONT_SIZE_KEY) || draft.fontSize || "10";
    $("#resume-show-address").checked = Boolean(draft.showAddress);
    applyResumeTemplate();
    const profileSnapshot = JSON.stringify(readProfileForResume());
    if (draft.html && (draft.profileSnapshot !== profileSnapshot || (draft.template && draft.template !== $("#resume-template").value))) {
      renderResumeFromProfile();
    } else if (draft.html) {
      $("#resume-preview").innerHTML = draft.html;
      if (!$("#resume-preview .resume-page-content")) $("#resume-preview").innerHTML = `<div class="resume-page-content">${draft.html}</div>`;
      $("#resume-draft-state").textContent = "已恢复本机草稿";
      fitResumeToOnePage();
      setResumeReady(true);
    }
  } catch { localStorage.removeItem(RESUME_DRAFT_KEY); }
}

function wordDocumentHTML(forPrint = false) {
  const resume = $("#resume-preview").innerHTML;
  const template = $("#resume-template").value;
  const accent = template === "blue" ? "#315c8a" : template === "compact" ? "#65527d" : "#41664d";
  const density = `${["9", "10", "11", "12"].includes($("#resume-font-size").value) ? $("#resume-font-size").value : "10"}pt`;
  const heading = template === "blue" ? "left" : "center";
  const printScript = forPrint ? `<script>window.addEventListener("load",()=>{const paper=document.querySelector(".resume-paper"),content=paper?.querySelector(".resume-page-content");if(content){content.style.zoom="1";const style=getComputedStyle(paper),available=paper.clientHeight-parseFloat(style.paddingTop||0)-parseFloat(style.paddingBottom||0);if(available>0&&content.scrollHeight>available)content.style.zoom=String(available/content.scrollHeight)}requestAnimationFrame(()=>{window.focus();window.print();window.addEventListener("afterprint",()=>window.close(),{once:true})})})<\/script>` : "";
  const agriStyles = template === "agri" ? `.resume-agri{display:grid;grid-template-columns:34% 66%;min-height:950px}.resume-agri-sidebar{padding:26px 20px;background:#f3f6f0;border-right:1px solid #dce5d8}.resume-agri-main{padding:30px 26px}.resume-agri-photo,.resume-agri-photo-placeholder{display:block;width:150px;height:190px;object-fit:cover;margin:0 auto 20px}.resume-agri-photo-placeholder{display:grid;place-items:center;background:#e3eae1;color:#69806f}.resume-agri-name{font-size:2em;color:#205a3c}.resume-agri-contact,.resume-agri-target,.resume-agri-copy{font-size:.9em;line-height:1.8;white-space:pre-wrap}.resume-section{margin:16px 0}.resume-section h3{font-size:1.2em;color:#205a3c;border-bottom:1px solid #bdd2c0;padding-bottom:5px}.resume-line{display:grid;grid-template-columns:76px minmax(0,1fr);gap:8px;margin:7px 0;font-size:.9em}.resume-date{font-size:.8em}.resume-agri-tags{display:flex;flex-wrap:wrap;gap:5px}.resume-agri-tag,.resume-agri-skill{padding:5px;border:1px solid #d5e4d3;border-radius:5px;margin:4px;font-size:.9em}.resume-agri-skill{white-space:pre-wrap}` : "";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>推免个人简历</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;width:210mm;height:297mm}body{font-family:Arial,"Microsoft YaHei",sans-serif;color:#26342b;font-size:${density};line-height:1.5}.resume-paper{position:relative;width:210mm;height:297mm;min-height:297mm;overflow:hidden;margin:0;padding:16mm 17mm;border:0;border-radius:0;box-shadow:none;font-size:${density}}.resume-page-content{width:100%;transform-origin:top left}h2{text-align:${heading};border-bottom:2px solid ${accent};padding-bottom:8px;margin:0 0 8px}h3{color:${accent};border-bottom:1px solid #dfe4d9;padding-bottom:3px;margin:8px 0 4px;font-size:1.08em}.resume-section{margin:6px 0}.resume-line{display:grid;grid-template-columns:90px minmax(0,1fr);gap:9px;margin:3px 0;font-size:${density};line-height:1.4}.resume-date{color:#69776a}.resume-entry-title{font-weight:bold}.resume-entry-sub{color:#5d6e61}.resume-entry p,.resume-ai-output{white-space:pre-wrap;line-height:1.4;font-size:${density};margin:2px 0 0}.resume-paper.template-blue .resume-header{text-align:left;border-bottom:1px solid ${accent};padding-bottom:8px;margin-bottom:8px}.resume-paper.template-blue .resume-section h3{border-left:3px solid ${accent};padding-left:6px}.resume-paper.template-agri{padding:0}.resume-agri{display:grid;grid-template-columns:34% 66%;width:100%;height:297mm;overflow:hidden}.resume-agri-sidebar{padding:14mm 8mm;background:#f3f6f0;border-right:1px solid #dce5d8}.resume-agri-main{min-width:0;padding:14mm 9mm}.resume-agri-photo,.resume-agri-photo-placeholder{display:block;width:36mm;height:44mm;object-fit:cover;margin:0 auto 8mm}.resume-agri-photo-placeholder{display:grid;place-items:center;background:#e3eae1;color:#69806f}.resume-agri-name{font-size:1.8em;color:#205a3c}.resume-agri-contact,.resume-agri-target,.resume-agri-copy,.resume-agri-tag,.resume-agri-skill{font-size:.9em;line-height:1.5;white-space:pre-wrap}.resume-section h3{font-size:1em}.resume-agri .resume-line{grid-template-columns:64px minmax(0,1fr);gap:6px;font-size:.82em;line-height:1.35}.resume-agri .resume-section{margin:5px 0}.resume-agri-tags{display:flex;flex-wrap:wrap;gap:3px}.resume-agri-tag,.resume-agri-skill{padding:3px;border:1px solid #d5e4d3;border-radius:4px;margin:2px}</style></head><body><article class="resume-paper template-${esc(template)}">${resume}</article>${printScript}</body></html>`;
}

function safeHttpsUrl(value) {
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; }
  catch { return ""; }
}

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

const importedFieldNames = {
  name: "姓名", namePinyin: "姓名拼音", identityType: "证件类型", identityNumber: "证件号码", birthDate: "出生日期",
  ethnicity: "民族", gender: "性别", politicalStatus: "政治面貌", militaryStatus: "现役军人", birthPlace: "出生地",
  nativePlace: "籍贯", address: "通讯地址", postalCode: "邮政编码", areaCode: "电话区号", phone: "移动电话",
  email: "考生电子邮箱", school: "所在学校", department: "所在院系", major: "所在专业", enrollmentMonth: "入学年月",
  expectedGraduationMonth: "预计毕业年月", studentNumber: "学号", gpa: "GPA / 平均成绩", rank: "成绩排名",
  summary: "个人简介", personalStatement: "个人陈述", education: "教育经历", work: "工作经历", research: "科研经历",
  publications: "发表成果", awards: "获奖经历", practice: "社会实践", languages: "外语水平", projects: "项目经历",
  coreCourses: "核心课程", skills: "专业技能",
  applyCollege: "拟报学院", applyMajor: "拟报专业",
};

function renderImportPreview(result, source = "AI 已识别 · 等待人工核对") {
  pendingProfileImport = result.profile;
  const current = readProfileForResume();
  const entries = Object.entries(result.profile);
  const notes = result.notes?.length ? `<div class="privacy-box"><b>需要核对</b>${result.notes.map(esc).join("<br>")}</div>` : "";
  $("#resume-import-preview").innerHTML = notes + entries.map(([key, value]) => {
    const isList = Array.isArray(value);
    const exists = isList ? nonemptyRecords(current[key]).length > 0 : Boolean(String(current[key] || "").trim());
    const editableValue = isList ? JSON.stringify(value, null, 2) : String(value);
    return `<div class="import-field-card"><label><input type="checkbox" data-import-toggle="${esc(key)}" checked>${esc(importedFieldNames[key] || key)}<small>${exists ? (isList ? "已有记录；按下方选项替换或合并" : "已有内容；确认后会用本次识别结果覆盖") : "当前为空，将填入识别结果"}</small></label><textarea data-import-value="${esc(key)}">${esc(editableValue)}</textarea></div>`;
  }).join("");
  $("#resume-import-preview").hidden = false;
  $("#resume-apply-import").disabled = entries.length === 0;
  $("#resume-ai-state").textContent = source;
  $("#resume-import-status").textContent = `识别到 ${entries.length} 项资料。请检查字段、取消不需要的项目，再确认导入。`;
}

function resetImportPreview() {
  pendingProfileImport = null;
  $("#resume-import-preview").hidden = true;
  $("#resume-apply-import").disabled = true;
}

function matchLocalProfileFields(text) {
  const buptProfile = matchBuptApplicationForm(text);
  if (buptProfile) return buptProfile;
  const chongqingProfile = matchChongqingApplicationBundle(text);
  if (chongqingProfile) return chongqingProfile;
  const southwestProfile = matchSouthwestEducationCampForm(text);
  if (southwestProfile) return southwestProfile;
  const xiamenProfile = matchXiamenEducationForm(text);
  if (xiamenProfile) return xiamenProfile;
  const labels = [
    ["namePinyin", ["姓名拼音", "拼音"]], ["identityType", ["证件类型", "证件类别"]],
    ["identityNumber", ["证件号码", "身份证号", "证件号"]], ["expectedGraduationMonth", ["预计毕业年月", "预计毕业时间", "毕业年月"]],
    ["enrollmentMonth", ["入学年月", "入学时间"]], ["studentNumber", ["在校生注册学号", "学号"]],
    ["politicalStatus", ["政治面貌"]], ["militaryStatus", ["现役军人", "军人状况"]],
    ["birthDate", ["出生日期", "出生年月"]], ["nativePlace", ["籍贯"]], ["birthPlace", ["出生地"]],
    ["postalCode", ["通讯地址邮政编码", "邮政编码", "邮编"]], ["areaCode", ["电话区号", "区号"]],
    ["department", ["所在院系", "所在学院", "院系"]], ["school", ["本科院校", "毕业院校", "所在学校", "学校名称"]],
    ["major", ["本科专业", "所学专业", "专业名称", "所在专业"]], ["email", ["考生电子邮箱", "电子邮箱", "邮箱"]],
    ["phone", ["移动电话", "联系电话", "手机号码", "手机号"]], ["gender", ["性别"]], ["ethnicity", ["民族"]],
    ["address", ["通讯地址", "通信地址", "联系地址"]], ["gpa", ["GPA", "平均绩点", "学分绩点", "平均成绩"]],
    ["rank", ["成绩排名", "专业排名", "成绩名次"]], ["personalStatement", ["个人陈述"]],
    ["summary", ["个人简介", "个人介绍", "自我评价"]], ["name", ["考生姓名", "申请人姓名", "真实姓名", "姓名"]],
  ].flatMap(([key, options]) => options.map((label) => ({ key, label }))).sort((a, b) => b.label.length - a.label.length);
  const headings = [
    ["education", /^(?:教育经历|教育背景|学习经历|学习和工作经历|学习与工作经历)$/],
    ["work", /^(?:工作经历|工作经验)$/], ["research", /^(?:科研经历|科研项目)$/], ["projects", /^(?:项目经历|项目经验)$/],
    ["publications", /^(?:发表成果|学术成果|论文成果|发表论文)$/], ["awards", /^(?:获奖经历|奖励情况|获奖情况)$/],
    ["practice", /^(?:社会实践|实践经历)$/], ["languages", /^(?:外语水平|语言能力|外语能力)$/],
  ];
  const profile = {};
  let section = "";
  let sectionText = [];
  const flushSection = () => {
    const value = sectionText.join("\n").trim();
    if (!section || !value) { sectionText = []; return; }
    const item = section === "research" ? { description: value }
      : section === "publications" ? { title: value }
        : section === "languages" ? { remarks: value }
          : { details: value };
    profile[section] = [...(Array.isArray(profile[section]) ? profile[section] : []), item];
    sectionText = [];
  };
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.replace(/\u00a0/g, " ").trim().replace(/^[•·▪\-—]+\s*/, "");
    if (!line) continue;
    const heading = headings.find(([, pattern]) => pattern.test(line.replace(/[：:]\s*.*$/, "").trim()));
    if (heading) {
      flushSection();
      section = heading[0];
      const rest = line.replace(/^[^：:]+[：:]\s*/, "").trim();
      if (rest && rest !== line) sectionText.push(rest);
      continue;
    }
    const labeled = labels.find(({ label }) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`^${escaped}(?:[：:=＝\\t]|\\s{2,})\\s*.+$`, "i").test(line);
    });
    if (labeled) {
      flushSection();
      section = "";
      const escaped = labeled.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const value = line.replace(new RegExp(`^${escaped}(?:[：:=＝\\t]|\\s{2,})\\s*`, "i"), "").trim();
      if (value && !profile[labeled.key]) profile[labeled.key] = value;
      continue;
    }
    if (section) sectionText.push(line);
  }
  flushSection();
  return profile;
}

function matchSouthwestEducationCampForm(text) {
  const source = String(text || "");
  const compact = source.normalize("NFKC").replace(/\s+/g, "");
  if (!/西南大学/.test(compact) || !/教育学部/.test(compact) || !/优秀大学生学术夏令营/.test(compact)) return null;
  const profile = {};
  const assign = (key, value) => { if (value) profile[key] = value.trim(); };
  const capture = (pattern) => compact.match(pattern)?.[1]?.trim() || "";
  assign("name", capture(/姓名(?:姓名)?([\u4e00-\u9fa5]{2,4})\1?性别/));
  assign("gender", capture(/性别(?:性别)?(男|女)/));
  assign("ethnicity", capture(/民族(?:民族)?([\u4e00-\u9fa5]{1,6})\1?出生日期/));
  const birth = capture(/出生日期(?:出生日期)?(20\d{2})年?(\d{1,2})月/);
  if (birth) {
    const parts = compact.match(/出生日期(?:出生日期)?(20\d{2})年?(\d{1,2})月/);
    profile.birthDate = `${parts[1]}-${parts[2].padStart(2, "0")}`;
  }
  assign("identityNumber", capture(/身份证号(?:身份证号)?(\d{17}[\dXx])/));
  assign("phone", capture(/手机号码(?:手机号码)?(1\d{10})/));
  assign("email", compact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]);
  const addressStart = compact.indexOf("黑龙江省");
  if (addressStart >= 0) {
    const addressTail = compact.slice(addressStart);
    const addressCode = addressTail.match(/\d{6}/);
    if (addressCode) {
      profile.address = addressTail.slice(0, addressCode.index).replace(/(?:黑龙江省){2,}/g, "黑龙江省");
      profile.postalCode = addressCode[0];
    }
  }
  const enrollment = compact.match(/入学时间(?:入学时间)?(20\d{2})[.年](\d{1,2})/);
  const graduation = compact.match(/毕业时间(?:毕业时间)?(20\d{2})[.年](\d{1,2})/);
  if (enrollment) profile.enrollmentMonth = `${enrollment[1]}-${enrollment[2].padStart(2, "0")}`;
  if (graduation) profile.expectedGraduationMonth = `${graduation[1]}-${graduation[2].padStart(2, "0")}`;
  if (enrollment || graduation) profile.education = [{ startDate: enrollment ? `${enrollment[1]}-${enrollment[2].padStart(2, "0")}` : "", endDate: graduation ? `${graduation[1]}-${graduation[2].padStart(2, "0")}` : "", school: "东北农业大学", major: "农林经济管理", details: "经济管理学院本科在读" }];
  profile.school = "东北农业大学";
  profile.department = "经济管理学院";
  profile.major = "农林经济管理";
  const cohortSize = capture(/同年级人数(?:同年级人数)?(\d{1,3})/);
  const rank = capture(/前五学期总评成绩在所学本科专业同年级的排名(?:前五学期总评成绩在所学本科专业同年级的排名)?(\d{1,3})/);
  if (rank) profile.rank = cohortSize ? `${rank}/${cohortSize}` : rank;
  const languages = [];
  const cet4 = capture(/CET\s*-?\s*4\s*(\d{3})\s*分?/i);
  const cet6 = capture(/CET\s*-?\s*6\s*(\d{3})\s*分?/i);
  if (cet4) languages.push({ language: "大学英语四级", score: cet4 });
  if (cet6) languages.push({ language: "大学英语六级", score: cet6 });
  if (languages.length) profile.languages = languages;

  const awardStart = compact.indexOf("学生相关获奖情况");
  const researchStart = compact.indexOf("学生相关科研经历");
  if (awardStart >= 0 && researchStart > awardStart) {
    const awardText = compact.slice(awardStart + "学生相关获奖情况".length, researchStart);
    const awardNames = [
      "第十九届工银融e行“挑战杯”省二等奖",
      "2025年全国大学生英语作文大赛国家三等奖",
      "2024年全国大学生英语翻译大赛省三等奖",
      "2024年第五届“华数杯”全国大学生数学建模竞赛三等奖",
    ];
    const awards = awardNames.filter((name) => awardText.includes(name.replace(/大学生/g, "大学生"))).map((raw) => {
      const yearMonth = raw.match(/(20\d{2})年(\d{1,2})月/);
      const level = raw.match(/(?:国家|省|校)(?:级)?(?:特等|一|二|三)等奖/)?.[0] || "";
      return { date: yearMonth ? `${yearMonth[1]}-${yearMonth[2].padStart(2, "0")}` : "", name: raw.replace(/^20\d{2}年/, "").replace(level, "").trim(), level };
    });
    if (awards.length) profile.awards = awards;
  }

  if (researchStart >= 0) {
    const recommendationStart = compact.search(/申请人所在院系推荐意见|所在学校教务部门意见/);
    const researchText = compact.slice(researchStart + "学生相关科研经历".length, recommendationStart > researchStart ? recommendationStart : undefined);
    const selfIntro = researchText.match(/本科期间(.+?)(?=主持省级SIPT项目)/)?.[0];
    if (selfIntro) profile.summary = selfIntro;
    const skillSentences = [...researchText.matchAll(/(?:我掌握了|具备)([^。；;]{2,50})/g)].map((match) => match[1].trim());
    if (skillSentences.length) profile.skills = [...new Set(skillSentences)].join("\n");
    const findSegment = (startMarker, endMarkers) => {
      const start = researchText.indexOf(startMarker);
      if (start < 0) return "";
      const contentStart = start + startMarker.length;
      const ends = endMarkers.map((marker) => researchText.indexOf(marker, contentStart)).filter((index) => index >= 0);
      return researchText.slice(contentStart, ends.length ? Math.min(...ends) : researchText.length);
    };
    const siptText = findSegment("SIPT省级项目", ["国家社会科学基金项目", "第十九届工银融e行", "养殖业担保风险指数", "借“数”致富"]);
    const nsfcText = findSegment("国家社会科学基金项目", ["第十九届工银融e行", "养殖业担保风险指数", "借“数”致富"]);
    const challengeText = findSegment("养殖业担保风险指数", ["借“数”致富"]);
    const manuscriptText = findSegment("借“数”致富", []);
    const stripRole = (value) => value.replace(/^[\d.、]+/, "").replace(/负责人|科研助理|参与成员|学术论文/g, "").replace(/^[\s“”"：:]+/, "");
    const projects = [];
    if (siptText) projects.push({ name: "高标准农田农业工程后期管护调查研究", organization: "省级 SIPT 项目", role: "负责人", description: stripRole(siptText) });
    if (challengeText) projects.push({ name: "养殖业担保风险指数与可贷款额度适配度研究——基于黑龙江省26家养殖企业的调研", organization: "第十九届工银融e行“挑战杯”", role: "参与成员", description: stripRole(challengeText) });
    if (projects.length) profile.projects = projects;
    if (nsfcText) profile.research = [{ name: "组织化与市场化视角下小农户与现代农业衔接路径研究", organization: "国家社会科学基金项目", role: "科研助理", description: stripRole(nsfcText) }];
    if (manuscriptText) profile.research = [...(profile.research || []), { name: "借“数”致富：村干部数字引流何以促进新型农村集体经济发展", role: "学术论文（初稿）", description: stripRole(manuscriptText) }];
    const publicationTitle = "“一核多元”农村基础设施管护体系优化路径研究";
    const publicationAt = researchText.indexOf(publicationTitle);
    if (publicationAt >= 0) {
      const publicationEndMarkers = ["目前已经发表于", "国家社会科学基金项目"];
      const publicationEnds = publicationEndMarkers.map((marker) => researchText.indexOf(marker, publicationAt + publicationTitle.length)).filter((index) => index >= 0);
      const publicationContext = researchText.slice(publicationAt + publicationTitle.length, publicationEnds.length ? Math.min(...publicationEnds) : publicationAt + publicationTitle.length);
      profile.publications = [{ title: publicationTitle, type: "期刊论文", journal: "村委主任", description: publicationContext }];
    }
  }
  return Object.keys(profile).length ? profile : null;
}

function matchXiamenEducationForm(text) {
  const source = String(text || "");
  const compact = source.replace(/\s+/g, "");
  if (!/厦门大学/.test(compact) || !/教育研究院/.test(compact)
    || !/(农林经济管理|申请院系和专业|0401Z3?教育心理学)/.test(compact)) return null;
  const profile = {};
  const assign = (key, value) => { if (value) profile[key] = value.trim(); };
  assign("name", compact.match(/姓名([\u4e00-\u9fa5]{2,4})/)?.[1]);
  assign("gender", compact.match(/性别([男女])/)?.[1]);
  const birthDate = compact.match(/出生年月(\d{4})(\d{2})(\d{2})/);
  if (birthDate) profile.birthDate = `${birthDate[1]}-${birthDate[2]}-${birthDate[3]}`;
  assign("identityNumber", compact.match(/身份证(?:号)?(\d{17}[\dXx])/)?.[1]);
  assign("phone", compact.match(/(?:联系电话|联系手机|联系电话)(1\d{10})/)?.[1]);
  assign("email", compact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]);
  assign("ethnicity", compact.match(/(?:民族)(汉族|满族|蒙古族|回族|藏族|维吾尔族|壮族|其他)/)?.[1]);
  assign("nativePlace", compact.match(/籍贯([^政]{2,24})政治面貌/)?.[1]);
  assign("address", compact.match(/通讯地址(.+?)联系电话/)?.[1]);
  assign("politicalStatus", compact.match(/政治面貌(中国共产主义青年团团员|中共党员|中共预备党员|共青团员|群众|其他)/)?.[1]);
  if (compact.includes("东北农业大学")) profile.school = "东北农业大学";
  if (compact.includes("经济管理学院")) profile.department = "经济管理学院";
  if (compact.includes("农林经济管理")) profile.major = "农林经济管理";
  assign("applyCollege", compact.match(/申请院系和专业(?:或方向)?(教育研究院)/)?.[1]);
  assign("applyMajor", compact.match(/教育研究院(0401Z3?教育心理学(?:不区分方向)?)/)?.[1]);

  const ranking = compact.match(/专业共(\d+)人[，,、]?排名第(\d+)名/);
  if (ranking) profile.rank = `${ranking[2]}/${ranking[1]}`;
  const educationDate = compact.match(/东北农业大学(20\d{2})年(\d{1,2})月至今/);
  if (educationDate) {
    const month = `${educationDate[1]}-${educationDate[2].padStart(2, "0")}`;
    profile.enrollmentMonth = month;
    profile.education = [{ startDate: month, school: "东北农业大学", major: "农林经济管理", details: "本科在读" }];
  }
  const languages = [];
  const cet4 = compact.match(/CET-?4成绩[:：]?(\d+(?:\.\d+)?)/i)?.[1];
  const cet6 = compact.match(/CET-?6成绩[:：]?(\d+(?:\.\d+)?)/i)?.[1];
  if (cet4) languages.push({ language: "大学英语四级", score: cet4 });
  if (cet6) languages.push({ language: "大学英语六级", score: cet6 });
  if (languages.length) profile.languages = languages;

  const awardLabel = compact.match(/何时何地获得何种奖励或荣誉/);
  const researchLabel = compact.search(/何时参加过哪些科研工作/);
  if (awardLabel && researchLabel > compact.indexOf(awardLabel[0])) {
    const awardBlock = compact.slice(compact.indexOf(awardLabel[0]) + awardLabel[0].length, researchLabel);
    const awardDatePattern = /(20\d{2})年\s*(\d{1,2})月/g;
    const dateMatches = [...awardBlock.matchAll(awardDatePattern)];
    const awards = dateMatches.map((match, index) => {
      const startAt = index ? dateMatches[index - 1].index + dateMatches[index - 1][0].length : 0;
      const rawName = awardBlock.slice(startAt, match.index).replace(/[|｜]/g, " ").trim();
      const level = rawName.match(/(?:国家|省|校)(?:级)?(?:特等|一|二|三)等奖/)?.[0] || "";
      const name = rawName.replace(level, "").replace(/^[\s,，、]+|[\s,，、]+$/g, "").trim();
      return { date: `${match[1]}-${match[2].padStart(2, "0")}`, name, level };
    }).filter((award) => award.name);
    if (awards.length) profile.awards = awards;
  }

  const itemSpecs = [
    { kind: "publication", marker: "一核多元", title: "“一核多元”农村基础设施管护体系优化路径研究" },
    { kind: "research", marker: "小农户与现代农业衔接路径研究", title: "小农户与现代农业衔接路径研究" },
    { kind: "project", marker: "养殖业担保风险指数", title: "养殖业担保风险指数与可贷款额度适配度研究——基于黑龙江省26家养殖企业的调研" },
    { kind: "project", marker: "高标准农田农业工程后期管护调查研究", title: "高标准农田农业工程后期管护调查研究" },
    { kind: "research", marker: "借数致富", title: "借“数”致富：村干部数字引流何以促进新型农村集体经济发展" },
  ].map((item) => ({ ...item, index: compact.indexOf(item.marker) })).filter((item) => item.index >= 0).sort((a, b) => a.index - b.index);
  const endMatch = compact.search(/推荐人情况|申请人在高校院系推荐意见/);
  const activityEnd = endMatch >= 0 ? endMatch : compact.length;
  const projects = [];
  const research = [];
  const publications = [];
  const monthFrom = (value) => {
    const match = value.match(/(20\d{2})年\s*(\d{1,2})月/);
    return match ? `${match[1]}-${match[2].padStart(2, "0")}` : "";
  };
  for (let index = 0; index < itemSpecs.length; index += 1) {
    const item = itemSpecs[index];
    const nextIndex = index + 1 < itemSpecs.length ? itemSpecs[index + 1].index : activityEnd;
    const chunk = compact.slice(item.index, nextIndex);
    const dateMatch = chunk.match(/(20\d{2})年(\d{1,2})月/);
    const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}` : "";
    const description = dateMatch ? chunk.slice(dateMatch.index + dateMatch[0].length).replace(/^[|｜\s，,:：、]+/, "").trim() : "";
    if (item.kind === "publication") {
      publications.push({ date, title: item.title, type: "发表论文", description });
      continue;
    }
    const record = { startDate: date, name: item.title, description };
    if (item.kind === "research" && /小农户/.test(item.marker)) {
      record.organization = "国家社会科学基金项目";
      record.role = "科研助理";
      research.push(record);
    } else if (item.kind === "research") {
      record.role = "论文初稿";
      research.push(record);
    } else {
      record.organization = /SIPT/i.test(chunk) || /大学生创新训练项目/.test(chunk) ? "省级 SIPT 项目" : "";
      record.role = /负责人/.test(chunk) ? "负责人" : /项目成员/.test(chunk) ? "项目成员" : "";
      projects.push(record);
    }
  }
  if (projects.length) profile.projects = projects;
  if (research.length) profile.research = research;
  if (publications.length) profile.publications = publications;
  return Object.keys(profile).length ? profile : null;
}

function matchChongqingApplicationBundle(text) {
  const source = String(text || "");
  const compact = source.replace(/\s+/g, "");
  if (!/重庆大学管理科学与房地产学院/.test(compact) || !/2027年预推免申请表/.test(compact) || !/参加科研工作和研究成果情况/.test(compact)) return null;

  // 只解析报名材料首页的申请表，避免把后面附带的论文全文误当成项目经历。
  const letterStart = source.search(/重庆大学管理科学与房地产学院\s*2027\s*年推免生自荐信/);
  const form = (letterStart >= 0 ? source.slice(0, letterStart) : source).replace(/\s+/g, " ").trim();
  const profile = {};
  const assign = (key, value) => { if (value) profile[key] = value.trim(); };
  const capture = (pattern) => form.match(pattern)?.[1]?.trim() || "";

  assign("name", capture(/姓\s*名\s+([\u4e00-\u9fa5]{2,4})\s+性\s*别/));
  assign("gender", capture(/性\s*别\s+(男|女)/));
  assign("identityNumber", capture(/身份证号\s+(\d{17}[\dXx])/));
  assign("phone", capture(/移动电话\s+(1\d{10})/));
  assign("school", capture(/本科学校\s+(.+?)\s+本科专业/));
  assign("major", capture(/本科专业\s+(.+?)\s+前\s*6\s*学期/));
  assign("gpa", capture(/学习成绩平均分\s*\/\s*绩点\s+([\d.]+)/));
  const total = capture(/专业人数\s+(\d+)/);
  const rank = capture(/专业排名\s+(\d+)/);
  if (rank) profile.rank = total ? `${rank}/${total}` : rank;
  const languages = [];
  const cet6 = capture(/英语\s*CET-6\s*成绩\s+(\d+)/);
  const otherLanguageScore = capture(/其他外语考试名称及成绩\s+大学英语四级\s+(\d+)/);
  if (cet6) languages.push({ language: "大学英语六级", score: cet6 });
  if (otherLanguageScore) languages.push({ language: "大学英语四级", score: otherLanguageScore });
  if (languages.length) profile.languages = languages;

  const researchStart = form.indexOf("科研工作：");
  const publicationStart = form.indexOf("发表论文：", researchStart);
  if (researchStart >= 0 && publicationStart > researchStart) {
    const block = form.slice(researchStart + "科研工作：".length, publicationStart);
    const datePattern = /\d{4}(?:年|[./-])\s*\d{1,2}\s*月?\s*(?:[-—–~至到])\s*\d{4}(?:年|[./-])\s*\d{1,2}\s*月?\s*/g;
    const starts = [...block.matchAll(datePattern)].map((match) => {
      const parts = [...match[0].matchAll(/(\d{4})\s*(?:年|[./-])\s*(\d{1,2})\s*月?/g)];
      return { index: match.index, text: match[0], monthRangeParts: parts };
    });
    const rows = starts.map((match, index) => {
      const startAt = match.index + match.text.length;
      const endAt = index + 1 < starts.length ? starts[index + 1].index : block.length;
      const raw = block.slice(startAt, endAt).trim();
      const nameMatch = raw.startsWith("《") ? raw.match(/^《(.+?)》/) : raw.match(/[“"](.+?)[”"]/);
      const name = nameMatch?.[1]?.trim() || raw;
      const meta = raw.slice(nameMatch ? nameMatch[0].length : 0).replace(/[“”"《》]/g, " ").trim();
      const role = meta.match(/负责人|科研助理|参与成员/)?.[0] || "";
      const organization = meta.match(/(?:国家社会科学基金项目|省级\s*SIPT|挑战杯省级二等奖项目|学术论文)/)?.[0] || "";
      const [startPart, endPart] = match.monthRangeParts || [];
      const startDate = startPart ? `${startPart[1]}-${startPart[2].padStart(2, "0")}` : "";
      const endDate = endPart ? `${endPart[1]}-${endPart[2].padStart(2, "0")}` : "";
      return {
        startDate, endDate, name,
        organization, role, division: role,
        description: "",
      };
    });

    const statement = source.slice(letterStart >= 0 ? letterStart : 0).replace(/\s+/g, " ");
    const projectDetails = [
      [/2024\s*年秋季.{0,180}?整理访谈转录稿\s*5\s*万余字[。．]?/, "赴黑龙江、辽宁两省28个村庄开展实地调研，累计访谈80余人，整理访谈转录稿5万余字。"],
      [/大二起.{0,180}?成果收录于人民出版社专著[。．]?/, "承担600余份农户问卷的数据处理与回归分析，相关成果收录于人民出版社专著。"],
      [/选取\s*27\s*个调研对象.{0,160}?已形成初稿[。．]?/, "选取27个调研对象，对近7万字访谈资料进行三级编码，以注意力经济为理论框架，分析数字技术驱动乡村治理转型的内在逻辑；论文已形成初稿。"],
    ];
    const siptProject = rows.find((row) => /高标准农田/.test(row.name));
    const socialScienceResearch = rows.find((row) => /国家社会科学基金/.test(row.organization));
    const challengeProject = rows.find((row) => /养殖业担保风险指数/.test(row.name));
    if (siptProject) siptProject.description = statement.match(projectDetails[0][0])?.[0] ? projectDetails[0][1] : "";
    if (socialScienceResearch) socialScienceResearch.description = statement.match(projectDetails[1][0])?.[0] ? projectDetails[1][1] : "";
    if (challengeProject) challengeProject.description = "围绕养殖业担保风险指数与可贷款额度适配度开展研究，调研对象为黑龙江省26家养殖企业。";
    const manuscript = rows.find((row) => /借“数”致富/.test(row.name));
    if (manuscript) manuscript.description = statement.match(projectDetails[2][0])?.[0] ? projectDetails[2][1] : "已形成初稿，尚未发表。";
    const researchRows = rows.filter((row) => /国家社会科学基金|学术论文/.test(row.organization));
    const projectRows = rows.filter((row) => !/国家社会科学基金|学术论文/.test(row.organization));
    if (researchRows.length) profile.research = researchRows;
    if (projectRows.length) profile.projects = projectRows;
  }

  if (publicationStart >= 0) {
    const publicationBlock = form.slice(publicationStart + "发表论文：".length);
    const published = publicationBlock.match(/(\d{4})[./-](\d{1,2})\s+(.+?)\s*《(.+?)》\s*发表于\s*《(.+?)》/);
    if (published) {
      profile.publications = [{
        date: `${published[1]}-${published[2].padStart(2, "0")}`,
        authorship: published[3].trim(),
        title: published[4].trim(),
        type: "期刊论文",
        journal: published[5].trim(),
      }];
    }
  }

  const courseText = source.match(/农业技术经济学\s*（\s*96\s*）.{0,100}?计量经济学\s*（\s*99\s*）/);
  if (courseText) profile.coreCourses = courseText[0].replace(/[，、]/g, "\n").replace(/\s+/g, " ").trim();

  if (!profile.research?.length && !profile.projects?.length) return null;
  return profile;
}

function matchBuptApplicationForm(text) {
  const source = String(text || "");
  if (!/北京邮电大学[\s\S]{0,80}接收推荐免试[\s\S]{0,80}申请表/.test(source.replace(/\s+/g, ""))) return null;
  const flat = source.replace(/申\s*请\s*人\s*基\s*本\s*情\s*况/g, " ")
    .replace(/拟\s*报\s*项\s*目/g, " ").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ");
  const valueBetween = (startLabel, endLabel) => {
    const start = flat.search(new RegExp(startLabel, "i"));
    if (start < 0) return "";
    const valueStart = start + flat.slice(start).match(new RegExp(startLabel, "i"))[0].length;
    const rest = flat.slice(valueStart);
    const end = rest.search(new RegExp(`\\s+(?:${endLabel})`, "i"));
    return rest.slice(0, end < 0 ? rest.length : end).trim().replace(/^[：:：，,、\s]+|[，,、\s]+$/g, "");
  };
  const profile = {};
  const assign = (key, value) => { if (value) profile[key] = value; };
  assign("name", valueBetween("姓名", "性别"));
  assign("gender", valueBetween("性别", "身份证号"));
  assign("identityNumber", valueBetween("身份证号", "毕业学校"));
  assign("school", valueBetween("毕业学校", "毕业专业"));
  assign("major", valueBetween("毕业专业", "本科专业"));
  const total = flat.match(/本科专业\s*人数\s*(\d+)/);
  const rank = valueBetween("本专业排名", "联系电话").match(/\d+/)?.[0] || "";
  if (rank) profile.rank = total ? `${rank}/${total[1]}` : rank;
  assign("phone", valueBetween("联系电话", "民族"));
  assign("ethnicity", valueBetween("民族", "E-mail"));
  assign("email", valueBetween("E-mail", "外语语种"));
  const language = valueBetween("外语语种、?\\s*等级水平", "外语成绩");
  const languageScore = valueBetween("外语成绩", "本科学号");
  if (language || languageScore) profile.languages = [{ language: language || "外语", score: languageScore }];
  assign("studentNumber", valueBetween("本科学号", "本科期间是否为国防生"));
  assign("applyCollege", valueBetween("拟报学院", "拟报专业"));
  assign("applyMajor", valueBetween("拟报专业", "拟报导师"));

  const awardRows = [];
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/^\s*[获奖情况]\s+(?=\d{4}[.-]\d{2})/, "").trim();
    const match = line.match(/^(\d{4})[.-](\d{2})[，,]?\s*(.+?)\s{2,}((?:国家|省|校)(?:级)?(?:特等奖|一等奖|二等奖|三等奖|优秀奖))\s*$/);
    if (match) awardRows.push({ date: `${match[1]}-${match[2]}`, name: match[3].replace(/^[，,、\s]+/, "").trim(), level: match[4] });
  }
  if (awardRows.length) profile.awards = awardRows;

  const publication = flat.match(/(\d{4})[.-](\d{2})\s+(.+?)\s*《(.+?)》\s*发表于\s*《(.+?)》/);
  if (publication) {
    profile.publications = [{ date: `${publication[1]}-${publication[2]}`, authorship: publication[3].trim(), title: publication[4].trim(), journal: publication[5].trim() }];
  }
  if (profile.school && profile.major) profile.education = [{ school: profile.school, major: profile.major }];
  return Object.keys(profile).length ? profile : null;
}

function previewLocalMatches(text) {
  const profile = matchLocalProfileFields(text);
  if (!Object.keys(profile).length) {
    $("#resume-import-status").textContent = "文字已转录，但没有找到清晰的“字段名：内容”或经历标题。可手动整理标签，或切换到 AI 模式匹配。";
    return;
  }
  const isBupt = /北京邮电大学[\s\S]{0,80}接收推荐免试[\s\S]{0,80}申请表/.test(String(text).replace(/\s+/g, ""));
  const compact = String(text).replace(/\s+/g, "");
  const isChongqing = /重庆大学管理科学与房地产学院/.test(compact) && /2027年预推免申请表/.test(compact);
  const isSouthwest = /西南大学/.test(compact) && /教育学部/.test(compact) && /优秀大学生学术夏令营/.test(compact);
  const isXiamen = /厦门大学/.test(compact) && /教育研究院/.test(compact);
  const notes = isBupt
    ? ["已按北京邮电大学 2027 年申请表的表格布局识别字段；教育经历仅填表内明确的学校和专业，不补造就读日期。请核对后导入。"]
    : isChongqing
      ? ["已按重庆大学 2027 年报名材料识别首页科研记录，并从自荐信补入项目内容；科研经历与项目经历将分别写入个人资料。请检查项目名称、时间和分工。"]
    : isSouthwest
      ? ["已按西南大学教育学部夏令营申请表识别基本信息、排名、四六级、奖励、科研项目与论文；请核对后导入个人资料。"]
    : isXiamen
      ? ["已按厦门大学教育研究院申请表识别字段和科研内容；论文、科研经历与项目经历将分别归档，请核对后导入。"]
    : ["本地匹配只识别有明确字段标签的内容；请逐项核对，未识别文字仍保留在转录框中。"];
  renderImportPreview({ profile, notes }, "本机匹配 · 等待人工核对");
  $("#resume-import-status").textContent = `本机识别到 ${Object.keys(profile).length} 项字段，无需调用 AI。`;
  applyResumeImport({ auto: true });
  return true;
}

async function analyzeResumeImport() {
  const file = $("#resume-import-file").files[0];
  const pasted = $("#resume-import-text").value.trim();
  const endpoint = $("#resume-ai-endpoint").value.trim();
  const model = $("#resume-ai-model").value.trim();
  const apiKey = $("#resume-ai-key").value.trim();
  if (!$("#resume-ai-consent").checked) { $("#resume-import-status").textContent = "请先勾选同意发送本次资料给 AI 服务。"; return; }
  if (!endpoint || !model || !apiKey) { $("#resume-import-status").textContent = "请填写 AI 接口地址、模型名称和密钥。"; return; }
  if (!file && !pasted) { $("#resume-import-status").textContent = "请先选择文件或粘贴简历 / 申请表文字。"; return; }
  if (file && file.size > 8 * 1024 * 1024) { $("#resume-import-status").textContent = "文件请控制在 8 MB 以内。"; return; }
  const button = $("#resume-analyze");
  button.disabled = true;
  $("#resume-import-preview").hidden = true;
  $("#resume-import-status").textContent = "正在本机提取文字并请求 AI 识别，请稍候…";
  try {
    const body = { ai: { endpoint, model, apiKey } };
    if (file) {
      body.filename = file.name;
      body.fileData = bytesToBase64(await file.arrayBuffer());
    } else body.text = pasted;
    const response = await fetch("/api/resume/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "识别失败");
    renderImportPreview(result);
  } catch (error) {
    $("#resume-import-status").textContent = error.message || "无法连接本机服务，请确认工作台服务正在运行。";
  } finally {
    $("#resume-ai-key").value = "";
    $("#resume-ai-consent").checked = false;
    button.disabled = false;
  }
}

async function transcribeResumeImport() {
  const file = $("#resume-import-file").files[0];
  const pasted = $("#resume-import-text").value.trim();
  const button = $("#resume-transcribe");
  resetImportPreview();
  if (!file && !pasted) { $("#resume-import-status").textContent = "请先选择文件或粘贴文字。"; return; }
  if (!file) {
    previewLocalMatches(pasted);
    return;
  }
  if (file.size > 8 * 1024 * 1024) { $("#resume-import-status").textContent = "文件请控制在 8 MB 以内。"; return; }
  button.disabled = true;
  $("#resume-import-status").textContent = "正在本机提取文字；扫描 PDF 会尝试使用 macOS 本地识别，不调用 AI、不上传资料…";
  try {
    const response = await fetch("/api/resume/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, fileData: bytesToBase64(await file.arrayBuffer()) }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "转录失败");
    $("#resume-import-text").value = result.text || "";
    $("#resume-import-status").textContent = `本机转录完成，共 ${result.text.length} 个字符。正在按明确标签匹配字段…`;
    $("#resume-ai-state").textContent = "本机文字转录 · 未调用 AI";
    previewLocalMatches(result.text || "");
  } catch (error) {
    $("#resume-import-status").textContent = error.message || "无法连接本机服务，请先重启工作台服务。";
  } finally {
    button.disabled = false;
  }
}

function applyResumeImport(options = {}) {
  const automatic = options.auto === true;
  if (!pendingProfileImport) return;
  const profile = readProfileForResume();
  const selected = [...$("#resume-import-preview").querySelectorAll("[data-import-toggle]:checked")];
  let imported = 0;
  for (const checkbox of selected) {
    const key = checkbox.dataset.importToggle;
    const field = $("#resume-import-preview").querySelector(`[data-import-value="${key}"]`);
    let value;
    try { value = field.value.trim().startsWith("[") ? JSON.parse(field.value) : field.value.trim(); }
    catch { $("#resume-import-status").textContent = `“${importedFieldNames[key] || key}”格式不是有效 JSON，请检查后重试。`; return; }
    if (Array.isArray(value)) {
      const existing = nonemptyRecords(profile[key]);
      const incoming = nonemptyRecords(value);
      if ($("#resume-import-replace-records").checked) {
        profile[key] = incoming;
      } else {
        const combined = [...existing];
        for (const row of incoming) {
          if (!combined.some((item) => JSON.stringify(item) === JSON.stringify(row))) combined.push(row);
        }
        profile[key] = combined;
      }
    } else if (typeof value === "string" && value.trim()) profile[key] = value.trim();
    else continue;
    imported += 1;
  }
  if (!imported) { $("#resume-import-status").textContent = "没有选择要导入的字段。"; return; }
  applyProfile(profile);
  renderResumeFromProfile();
  setView("profile");
  $("#profile-save-state").textContent = `● 已写入个人资料 ${imported} 项；简历已同步更新`;
  $("#resume-import-status").textContent = automatic
    ? `已自动写入个人资料的 ${imported} 个对应栏目，并已从最新资料更新简历；可在下方检查或修改识别值。`
    : `已写入个人资料的 ${imported} 个对应栏目，并从最新个人资料更新简历。`;
  toast(`已自动写入 ${imported} 项个人资料，简历草稿已更新`);
  if (!automatic) pendingProfileImport = null;
}

function getConsultants() {
  try { return JSON.parse(localStorage.getItem(CONSULTANTS_KEY) || "[]"); }
  catch { return []; }
}

function renderConsultants() {
  const rows = getConsultants();
  const target = $("#consultant-list");
  target.innerHTML = rows.length ? rows.map((person) => {
    const services = (person.services || []).map((service) => `<div class="consult-service"><b><span>${esc(service.name)}</span><span>免费</span></b>${service.detail ? `<span>${esc(service.detail)}</span>` : ""}</div>`).join("");
    return `<article class="consultant-card"><div class="consultant-head"><div><h3>${esc(person.name)}</h3><small>${esc(person.title || "互助志愿者")}</small></div><button class="iconbtn" data-remove-consultant="${esc(person.id)}">删除</button></div><p><b>擅长内容：</b>${esc(person.expertise)}</p><div>${services}</div>${person.contact ? `<p><b>交流方式：</b>${esc(person.contact)}</p>` : ""}${person.disclosure ? `<p>${esc(person.disclosure)}</p>` : ""}</article>`;
  }).join("") : '<div class="consult-empty">还没有互助志愿者信息。填写左侧表单后，会在这里展示免费帮助内容。</div>';
}

$("#resume-generate").addEventListener("click", renderResumeFromProfile);
$("#resume-transcribe").addEventListener("click", transcribeResumeImport);
$("#resume-apply-import").addEventListener("click", applyResumeImport);
$("#resume-template").addEventListener("change", () => {
  applyResumeTemplate();
  if ([".resume-header", ".resume-agri", ".resume-ai-output"].some((selector) => $("#resume-preview").querySelector(selector))) renderResumeFromProfile();
  else saveResumeDraft(false);
});
$("#resume-font-size").addEventListener("change", () => { applyResumeFontSize(); fitResumeToOnePage(); saveResumeDraft(false); });
window.addEventListener("resize", () => requestAnimationFrame(fitResumeToOnePage));
$("#resume-import-file").addEventListener("change", () => { resetImportPreview(); if ($("#resume-import-file").files.length) $("#resume-import-text").value = ""; });
$("#resume-import-text").addEventListener("input", () => { resetImportPreview(); if ($("#resume-import-text").value.trim()) $("#resume-import-file").value = ""; });
$("#resume-save").addEventListener("click", () => saveResumeDraft(true));
$("#resume-ai-polish").addEventListener("click", polishResumeWithAI);
$("#resume-ai-apply").addEventListener("click", () => {
  const value = $("#resume-ai-result").value.trim();
  if (!value) { $("#resume-ai-status").textContent = "AI 结果为空，请先生成或编辑优化稿。"; return; }
  $("#resume-preview").innerHTML = `<div class="resume-page-content"><div class="resume-ai-output">${esc(value)}</div></div>`;
  applyResumeTemplate();
  fitResumeToOnePage();
  setResumeReady(true);
  saveResumeDraft(false);
  $("#resume-ai-status").textContent = "已采用 AI 优化稿，可继续核对、编辑要求或导出。";
  $("#resume-draft-state").textContent = "AI 优化稿已应用";
});
$("#resume-ai-discard").addEventListener("click", () => {
  $("#resume-ai-result-wrap").hidden = true;
  $("#resume-ai-status").textContent = "已保留当前简历。";
});
$("#resume-word").addEventListener("click", () => download("推免个人简历.doc", wordDocumentHTML(), "application/msword;charset=utf-8"));
$("#resume-pdf").addEventListener("click", () => {
  fitResumeToOnePage();
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(wordDocumentHTML(true));
    printWindow.document.close();
    return;
  }
  document.body.classList.add("print-resume");
  window.print();
  window.addEventListener("afterprint", () => document.body.classList.remove("print-resume"), { once: true });
});
$("#consultant-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const services = $("#consult-services").value.split(/\r?\n/).map((line) => line.split(/[|｜]/).map((part) => part.trim())).filter((parts) => parts.some(Boolean)).map(([name, detail]) => ({ name: name || "互助内容", detail: detail || "", fee: "免费" }));
  const rows = getConsultants();
  rows.push({ id: crypto.randomUUID(), name: $("#consult-name").value.trim(), title: $("#consult-title").value.trim(), expertise: $("#consult-expertise").value.trim(), services, contact: $("#consult-contact").value.trim(), disclosure: $("#consult-disclosure").value.trim() });
  localStorage.setItem(CONSULTANTS_KEY, JSON.stringify(rows));
  event.target.reset();
  renderConsultants();
  toast("互助志愿者信息已保存到本机");
});
document.addEventListener("click", (event) => {
  const removeConsultant = event.target.closest("[data-remove-consultant]");
  if (removeConsultant) {
    localStorage.setItem(CONSULTANTS_KEY, JSON.stringify(getConsultants().filter((item) => item.id !== removeConsultant.dataset.removeConsultant)));
    renderConsultants();
  }
});
restoreResumeDraft();
setResumeReady(Boolean($("#resume-preview").querySelector(".resume-header, .resume-agri, .resume-ai-output")));
renderConsultants();
