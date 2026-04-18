/**
 * Firebase Configuration & Database Helper
 * Wraps Firestore operations for roster, pending approvals, class codes, assignments, scores.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc, addDoc, updateDoc, query, where, increment } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBwc-NTAGSo9KXns_kc_kDYorBd4DAMSzI",
    authDomain: "pssa-testing.firebaseapp.com",
    projectId: "pssa-testing",
    storageBucket: "pssa-testing.firebasestorage.app",
    messagingSenderId: "995750371410",
    appId: "1:995750371410:web:552e1b603515d9c4d07f8b",
    measurementId: "G-KS97CTNHSX"
};

let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error('Firebase init failed:', e);
}

// ========== ROSTER (approved students) ==========

window.fbGetRoster = async function() {
    const snap = await getDocs(collection(db, 'roster'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.fbAddToRoster = async function(student) {
    return await addDoc(collection(db, 'roster'), student);
};

window.fbRemoveFromRoster = async function(docId) {
    return await deleteDoc(doc(db, 'roster', docId));
};

window.fbUpdateRoster = async function(docId, updates) {
    return await updateDoc(doc(db, 'roster', docId), updates);
};

window.fbFindInRoster = async function(firstName, lastName) {
    const snap = await getDocs(collection(db, 'roster'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).find(r =>
        r.firstName.toLowerCase() === firstName.toLowerCase() &&
        r.lastName.toLowerCase() === lastName.toLowerCase()
    );
};

// ========== PENDING APPROVALS ==========

window.fbGetPending = async function() {
    const snap = await getDocs(collection(db, 'pending'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.fbAddPending = async function(student) {
    return await addDoc(collection(db, 'pending'), student);
};

window.fbRemovePending = async function(docId) {
    return await deleteDoc(doc(db, 'pending', docId));
};

window.fbFindPending = async function(firstName, lastName) {
    const snap = await getDocs(collection(db, 'pending'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).find(p =>
        p.firstName.toLowerCase() === firstName.toLowerCase() &&
        p.lastName.toLowerCase() === lastName.toLowerCase()
    );
};

// ========== CLASS CODES ==========

window.fbGetClassCodes = async function() {
    const docSnap = await getDoc(doc(db, 'config', 'classCodes'));
    return docSnap.exists() ? docSnap.data() : {};
};

window.fbSetClassCode = async function(className, code) {
    const codes = await fbGetClassCodes();
    codes[className] = code;
    return await setDoc(doc(db, 'config', 'classCodes'), codes);
};

window.fbGetClassData = async function() {
    const docSnap = await getDoc(doc(db, 'config', 'classData'));
    return docSnap.exists() ? docSnap.data() : {};
};

window.fbSaveClassData = async function(classId, data) {
    const all = await fbGetClassData();
    all[classId] = data;
    return await setDoc(doc(db, 'config', 'classData'), all);
};

window.fbDeleteClassData = async function(classId) {
    const all = await fbGetClassData();
    delete all[classId];
    return await setDoc(doc(db, 'config', 'classData'), all);
};

// ========== ASSIGNMENTS ==========

window.fbGetAssignments = async function() {
    const docSnap = await getDoc(doc(db, 'config', 'assignments'));
    return docSnap.exists() ? docSnap.data() : {};
};

window.fbSaveAssignments = async function(assignments) {
    return await setDoc(doc(db, 'config', 'assignments'), assignments);
};

// ========== SCORES ==========

window.fbGetScores = async function() {
    const snap = await getDocs(collection(db, 'scores'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.fbSaveScore = async function(record) {
    return await addDoc(collection(db, 'scores'), record);
};

window.fbDeleteScore = async function(docId) {
    return await deleteDoc(doc(db, 'scores', docId));
};

window.fbClearScores = async function() {
    const snap = await getDocs(collection(db, 'scores'));
    const deletes = snap.docs.map(d => deleteDoc(d.ref));
    return await Promise.all(deletes);
};

// ========== CUSTOM TESTS ==========

window.fbGetCustomTests = async function() {
    const snap = await getDocs(collection(db, 'customTests'));
    const result = {};
    snap.docs.forEach(d => { result[d.id] = d.data(); });
    return result;
};

window.fbSaveCustomTest = async function(testId, testData) {
    return await setDoc(doc(db, 'customTests', testId), testData);
};

window.fbDeleteCustomTest = async function(testId) {
    return await deleteDoc(doc(db, 'customTests', testId));
};

// ========== CUSTOM SKILLS ==========

window.fbGetCustomSkills = async function() {
    const snap = await getDocs(collection(db, 'customSkills'));
    const result = {};
    snap.docs.forEach(d => { result[d.id] = d.data(); });
    return result;
};

window.fbSaveCustomSkill = async function(skillId, skillData) {
    return await setDoc(doc(db, 'customSkills', skillId), skillData);
};

window.fbDeleteCustomSkill = async function(skillId) {
    return await deleteDoc(doc(db, 'customSkills', skillId));
};

// ========== HELP REQUESTS ==========

window.fbGetHelpRequests = async function() {
    const snap = await getDocs(collection(db, 'helpRequests'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.fbAddHelpRequest = async function(request) {
    return await addDoc(collection(db, 'helpRequests'), request);
};

window.fbRemoveHelpRequest = async function(docId) {
    return await deleteDoc(doc(db, 'helpRequests', docId));
};

// ===== SCORE UPDATES =====
window.fbUpdateScore = async function(docId, updates) {
    return await updateDoc(doc(db, 'scores', docId), updates);
};

// ===== PARENTS =====
window.fbGetParents = async function() {
    const snap = await getDocs(collection(db, 'parents'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.fbAddParent = async function(parent) {
    return await addDoc(collection(db, 'parents'), parent);
};

window.fbUpdateParent = async function(docId, updates) {
    return await updateDoc(doc(db, 'parents', docId), updates);
};

window.fbFindParentByEmail = async function(email) {
    const all = await window.fbGetParents();
    return all.find(p => (p.email || '').toLowerCase() === email.toLowerCase()) || null;
};

window.fbRemoveParent = async function(docId) {
    return await deleteDoc(doc(db, 'parents', docId));
};

// ========== ENROLLMENT: COURSES ==========

window.fbGetCourses = async function() {
    const snap = await getDocs(collection(db, 'courses'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.fbSaveCourse = async function(courseId, courseData) {
    return await setDoc(doc(db, 'courses', courseId), courseData);
};

window.fbDeleteCourse = async function(courseId) {
    return await deleteDoc(doc(db, 'courses', courseId));
};

// Atomic enrollment counter. delta is +1 on new registration and when
// un-refunding; -1 when moving to refunded or deleting a held spot.
window.fbIncrementCourseEnrollment = async function(courseId, delta) {
    return await updateDoc(doc(db, 'courses', courseId), { enrolledCount: increment(delta) });
};

// ========== SITE SETTINGS (singleton doc for public pages) ==========

window.fbGetSiteSettings = async function() {
    const snap = await getDoc(doc(db, 'siteSettings', 'config'));
    return snap.exists() ? snap.data() : null;
};

window.fbSaveSiteSettings = async function(data) {
    return await setDoc(doc(db, 'siteSettings', 'config'), data);
};

// ========== ENROLLMENT: REGISTRATIONS ==========

window.fbGetRegistrations = async function() {
    const snap = await getDocs(collection(db, 'registrations'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.fbAddRegistration = async function(registration) {
    return await addDoc(collection(db, 'registrations'), registration);
};

window.fbUpdateRegistration = async function(docId, updates) {
    return await updateDoc(doc(db, 'registrations', docId), updates);
};

window.fbDeleteRegistration = async function(docId) {
    return await deleteDoc(doc(db, 'registrations', docId));
};

// Signal that Firebase is ready
window.firebaseReady = true;
console.log('Firebase initialized successfully');
