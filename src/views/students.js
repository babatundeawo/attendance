/** Students tab: add / edit form, search, CSV export and removal. */
import { confirmDialog, downloadCsv, h, icon, mount, toast } from "../dom.js";
import { actions } from "../sync.js";
import { autoParent, initials, newStudentId, nextOrderFor, sortStudents } from "../logic.js";
import { state, update } from "../store.js";

const $ = (id) => document.getElementById(id);
let gender = "M";

function setGender(value) {
  gender = value;
  for (const [id, g] of [["fGenM", "M"], ["fGenF", "F"]]) {
    $(id).classList.toggle("is-on", g === value);
    $(id).setAttribute("aria-checked", String(g === value));
  }
}

function clearForm() {
  $("studentForm").reset();
  $("fId").value = "";
  $("fNameField").classList.remove("invalid");
  $("fReligion").value = "Christianity";
  $("formTitle").textContent = "Add a student";
  setGender("M");
}

function loadForm(st) {
  $("fId").value = st.id;
  $("fName").value = st.name;
  $("fAdm").value = st.admissionNo || "";
  $("fDob").value = st.dob || "";
  $("fParent").value = st.parentName || "";
  $("fAddr").value = st.address || "";
  $("fPhone").value = st.phone || "";
  $("fReligion").value = st.religion || "Christianity";
  $("formTitle").textContent = "Edit student";
  setGender(st.gender);
  $("studentForm").scrollIntoView({ behavior: "smooth", block: "start" });
  $("fName").focus({ preventScroll: true });
}

export function initStudents() {
  $("stuSearchIcon").append(icon("search", 18));
  $("exportStudentsCsv").append(icon("download", 16), " Export CSV");
  $("fGenM").addEventListener("click", () => setGender("M"));
  $("fGenF").addEventListener("click", () => setGender("F"));
  $("fCancel").addEventListener("click", clearForm);
  $("fAutoParent").addEventListener("click", () => {
    $("fParent").value = autoParent($("fName").value);
  });
  $("studentsSearch").addEventListener("input", (e) => update({ studentsQuery: e.target.value }));

  $("studentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("fName").value.trim();
    if (!name) {
      $("fNameField").classList.add("invalid");
      toast("Enter the student's name", "error");
      $("fName").focus();
      return;
    }
    $("fNameField").classList.remove("invalid");
    const existingId = $("fId").value;
    const id = existingId || newStudentId();
    const existing = state.students.find((s) => s.id === id);
    actions.saveStudent(id, {
      name,
      gender,
      order: existing && typeof existing.order === "number" ? existing.order : nextOrderFor(state.students, gender),
      admissionNo: $("fAdm").value.trim(),
      dob: $("fDob").value,
      parentName: $("fParent").value.trim() || autoParent(name),
      address: $("fAddr").value.trim(),
      phone: $("fPhone").value.trim(),
      religion: $("fReligion").value,
    });
    clearForm();
    toast(existingId ? "Student updated" : "Student added");
  });

  $("exportStudentsCsv").addEventListener("click", () => {
    const rows = [["Name", "Gender", "Admission No", "DOB", "Parent/Guardian", "Address", "Phone", "Religion"]];
    for (const st of sortStudents(state.students)) {
      rows.push([st.name, st.gender, st.admissionNo, st.dob, st.parentName, st.address, st.phone, st.religion]);
    }
    downloadCsv("students.csv", rows);
  });
  clearForm();
}

function studentItem(st) {
  const open = h(
    "button",
    { class: "stu-open", type: "button", "aria-label": `Edit ${st.name}`, onclick: () => loadForm(st) },
    h("span", { class: `avatar g-${st.gender}`, "aria-hidden": "true" }, initials(st.name)),
    h("span", { class: "txt" }, h("span", { class: "n" }, st.name), h("span", { class: "a" }, st.admissionNo ? `Adm. ${st.admissionNo}` : "No admission no.")),
  );
  const remove = h(
    "button",
    {
      class: "btn btn-danger-quiet btn-sm",
      type: "button",
      "aria-label": `Remove ${st.name}`,
      onclick: async () => {
        const ok = await confirmDialog(
          `Remove ${st.name}?`,
          "This deletes the student record. Their attendance history will remain but will no longer be counted.",
          "Remove",
        );
        if (!ok) return;
        actions.removeStudent(st.id);
        toast(`Removed ${st.name}`);
      },
    },
    "Remove",
  );
  return h("div", { class: "stu-item" }, open, remove);
}

export function renderStudents() {
  const q = state.studentsQuery.trim().toLowerCase();
  const sorted = sortStudents(state.students);
  for (const [g, listId, countId] of [["M", "stuListM", "cntM"], ["F", "stuListF", "cntF"]]) {
    const group = sorted.filter((s) => s.gender === g && (!q || s.name.toLowerCase().includes(q)));
    $(countId).textContent = group.length;
    mount(
      $(listId),
      group.length ? group.map(studentItem) : h("p", { class: "note" }, q ? "No matches." : state.loaded.students ? "No students yet." : "Loading…"),
    );
  }
}
