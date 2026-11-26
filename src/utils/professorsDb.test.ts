import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateAdmin,
  authenticateProfessor,
  getLocStr,
  INITIAL_PROFESSORS_DB,
  createTeacherInDb,
  updateTeacherInDb,
  deleteTeacherFromDb,
  addCourseToProfessorInDb,
  updateCourseInProfessorInDb,
  deleteCourseFromProfessorInDb,
  addDocumentToCourseInDb,
  updateDocumentInCourseInDb,
  deleteDocumentFromCourseInDb,
  getCourseDocuments
} from './professorsDb.ts';

test('Professor 1 authentication with 1111/1111', () => {
  const prof1 = authenticateProfessor('1111', '1111');
  assert.ok(prof1 !== null, 'Prof 1 should authenticate');
  assert.equal(prof1.login, '1111');
  assert.equal(getLocStr(prof1.name, 'uk'), 'Професор 1: Д-р Алехандро Мартін');
  assert.equal(getLocStr(prof1.name, 'en'), 'Professor 1: Dr. Alejandro Martín');
  assert.equal(getLocStr(prof1.name, 'es'), 'Profesor 1: Dr. Alejandro Martín');
  assert.ok(prof1.courses.length >= 2);
  assert.ok(prof1.driveItems.length >= 3);
});

test('Professor 2 authentication with 2222/2222', () => {
  const prof2 = authenticateProfessor('2222', '2222');
  assert.ok(prof2 !== null, 'Prof 2 should authenticate');
  assert.equal(prof2.login, '2222');
  assert.equal(getLocStr(prof2.name, 'uk'), 'Професор 2: Д-р Карлос Санчес');
  assert.equal(getLocStr(prof2.name, 'en'), 'Professor 2: Dr. Carlos Sánchez');
  assert.equal(getLocStr(prof2.name, 'es'), 'Profesor 2: Dr. Carlos Sánchez');
  assert.ok(prof2.courses.length >= 2);
  assert.ok(prof2.driveItems.length >= 3);
});

test('Professor 3 authentication with 3333/3333', () => {
  const prof3 = authenticateProfessor('3333', '3333');
  assert.ok(prof3 !== null, 'Prof 3 should authenticate');
  assert.equal(prof3.login, '3333');
  assert.equal(getLocStr(prof3.name, 'uk'), 'Професор 3: Д-р Беатріс Ернандес');
  assert.equal(getLocStr(prof3.name, 'en'), 'Professor 3: Dr. Beatriz Hernández');
  assert.equal(getLocStr(prof3.name, 'es'), 'Profesor 3: Dra. Beatriz Hernández');
  assert.ok(prof3.courses.length >= 2);
  assert.ok(prof3.driveItems.length >= 3);
});

test('Authentication fails on wrong credentials', () => {
  const wrongPass = authenticateProfessor('1111', 'wrong');
  assert.equal(wrongPass, null);
  const wrongUser = authenticateProfessor('9999', '1111');
  assert.equal(wrongUser, null);
});

test('All professors have complete trilingual courses and repositories', () => {
  INITIAL_PROFESSORS_DB.forEach(({ profile }) => {
    ['uk', 'en', 'es'].forEach((lang) => {
      const l = lang as 'uk' | 'en' | 'es';
      assert.ok(getLocStr(profile.name, l).length > 0);
      assert.ok(getLocStr(profile.specialty, l).length > 0);
      assert.ok(getLocStr(profile.department, l).length > 0);
      profile.courses.forEach((c) => {
        assert.ok(getLocStr(c.title, l).length > 0);
        assert.ok(getLocStr(c.semester, l).length > 0);
      });
      profile.driveItems.forEach((d) => {
        assert.ok(getLocStr(d.name, l).length > 0);
        assert.ok(getLocStr(d.description, l).length > 0);
      });
    });
  });
});

test('Admin authentication validates admin/admin only', () => {
  const validAdmin = authenticateAdmin('admin', 'admin');
  assert.ok(validAdmin !== null);
  assert.equal(validAdmin.login, 'admin');
  assert.equal(authenticateAdmin('admin', 'wrong'), null);
  assert.equal(authenticateAdmin('1111', '1111'), null);
});

test('Administrator CRUD for Teachers: create, read/auth, update, delete', () => {
  let db = [...INITIAL_PROFESSORS_DB];
  const initialCount = db.length;

  // Create
  const { db: dbAfterCreate, created } = createTeacherInDb(db, {
    login: '4444',
    password: 'secret',
    name: 'Dr. Maria Koval',
    title: 'Associate Professor',
    faculty: 'Faculty of Letters',
    department: 'Digital Heritage',
    specialty: 'Archival Informatics'
  });
  db = dbAfterCreate;
  assert.equal(db.length, initialCount + 1);
  assert.equal(created.login, '4444');

  // Newly created teacher can authenticate
  const authed = authenticateProfessor('4444', 'secret', db);
  assert.ok(authed !== null);
  assert.equal(getLocStr(authed.name, 'en'), 'Dr. Maria Koval');

  // Duplicate login fails
  assert.throws(() => {
    createTeacherInDb(db, {
      login: '4444',
      password: 'x',
      name: 'Dup',
      title: 'T',
      faculty: 'F',
      department: 'D',
      specialty: 'S'
    });
  });

  // Update
  db = updateTeacherInDb(db, created.id, {
    name: 'Prof. Maria Koval',
    department: 'Applied AI & Heritage'
  });
  const updatedRecord = db.find((r) => r.id === created.id);
  assert.ok(updatedRecord);
  assert.equal(getLocStr(updatedRecord.profile.name, 'en'), 'Prof. Maria Koval');
  assert.equal(getLocStr(updatedRecord.profile.department, 'uk'), 'Applied AI & Heritage');

  // Delete
  db = deleteTeacherFromDb(db, created.id);
  assert.equal(db.length, initialCount);
  assert.equal(authenticateProfessor('4444', 'secret', db), null);
});

test('Teacher CRUD for Courses & Documents inside each course repository', () => {
  let db = [...INITIAL_PROFESSORS_DB];
  const profId = 'prof-1';

  // Create Course
  const courseRes = addCourseToProfessorInDb(db, profId, {
    code: 'AI-HER-9',
    title: 'Semantic Heritage Modeling',
    semester: '1st Semester',
    credits: 6,
    groups: ['HER-101'],
    enrolledStudents: 30,
    academicYear: '2026/2027',
    isCurrentYear: true,
    syllabusTopic: 'RDF & Architectural Metadata'
  });
  db = courseRes.db;
  const newCourseId = courseRes.createdCourse.id;
  assert.ok(courseRes.updatedProfessor);
  assert.ok(courseRes.updatedProfessor.courses.some((c) => c.id === newCourseId));

  // Update Course
  const courseUpdateRes = updateCourseInProfessorInDb(db, profId, newCourseId, {
    title: 'Advanced Semantic Heritage Modeling',
    credits: 9
  });
  db = courseUpdateRes.db;
  const updatedCourse = courseUpdateRes.updatedProfessor?.courses.find((c) => c.id === newCourseId);
  assert.ok(updatedCourse);
  assert.equal(getLocStr(updatedCourse.title, 'en'), 'Advanced Semantic Heritage Modeling');
  assert.equal(updatedCourse.credits, 9);

  // Create Document inside Course Repository
  const docRes = addDocumentToCourseInDb(db, profId, {
    name: 'Lecture 1: Wikidata SPARQL Guide',
    type: 'lecture',
    folderCategory: 'lectures',
    courseId: newCourseId,
    group: 'HER-101',
    academicYear: '2026/2027',
    size: '2.4 MB',
    fileName: 'sparql_guide.pdf',
    fileFormat: 'PDF',
    description: 'Introductory PDF for RDF triples'
  });
  db = docRes.db;
  assert.ok(docRes.updatedProfessor);
  const docsInCourse = getCourseDocuments(docRes.updatedProfessor, newCourseId);
  assert.equal(docsInCourse.length, 1);
  assert.equal(getLocStr(docsInCourse[0].name, 'en'), 'Lecture 1: Wikidata SPARQL Guide');

  // Update Document
  const docUpdateRes = updateDocumentInCourseInDb(db, profId, docRes.createdDocument.id, {
    name: 'Lecture 1: Updated SPARQL Guide',
    folderCategory: 'practices'
  });
  db = docUpdateRes.db;
  const updatedDoc = docUpdateRes.updatedProfessor?.driveItems.find((d) => d.id === docRes.createdDocument.id);
  assert.ok(updatedDoc);
  assert.equal(getLocStr(updatedDoc.name, 'en'), 'Lecture 1: Updated SPARQL Guide');
  assert.equal(updatedDoc.folderCategory, 'practices');

  // Delete Document
  const docDeleteRes = deleteDocumentFromCourseInDb(db, profId, docRes.createdDocument.id);
  db = docDeleteRes.db;
  assert.equal(getCourseDocuments(docDeleteRes.updatedProfessor!, newCourseId).length, 0);

  // Add another doc then Delete Course -> verifies cascade document removal
  const doc2Res = addDocumentToCourseInDb(db, profId, {
    name: 'Temp Doc',
    type: 'test',
    folderCategory: 'tests',
    courseId: newCourseId,
    academicYear: '2026/2027',
    description: 'Test doc'
  });
  db = doc2Res.db;
  const courseDelRes = deleteCourseFromProfessorInDb(db, profId, newCourseId);
  db = courseDelRes.db;
  assert.equal(courseDelRes.updatedProfessor!.courses.some((c) => c.id === newCourseId), false);
  assert.equal(getCourseDocuments(courseDelRes.updatedProfessor!, newCourseId).length, 0);
});
