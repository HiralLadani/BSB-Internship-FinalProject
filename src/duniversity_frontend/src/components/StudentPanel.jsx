import React from "react";
import UserProfileForm from "./UserProfileForm";

export default function StudentPanel({
  principalText,
  currentProfile,
  onUpdateProfile,
  coursesForVoting,
  approvedCourses,
  myEnrolledCourses,
  onVoteCourse,
  onEnrollCourse
}) {
  return (
    <div className="panel student-panel">
      <h2>Student Dashboard</h2>
      <UserProfileForm
        principalText={principalText}
        currentProfile={currentProfile}
        onSubmit={onUpdateProfile}
      />

      <section>
        <h3>Voting Courses</h3>
        <ul>
          {coursesForVoting.map(c => (
            <li key={c.id}>
              <strong>{c.title}</strong> – {c.professor_id}
              <button onClick={() => onVoteCourse(c.id)}>Vote</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Approved Courses</h3>
        <ul>
          {approvedCourses.map(c => (
            <li key={c.id}>
              <strong>{c.title}</strong> – {c.professor_id}
              <button onClick={() => onEnrollCourse(c.id)}>Enroll</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>My Enrollments</h3>
        <ul>
          {myEnrolledCourses.map(c => (
            <li key={c.id}>{c.title}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
