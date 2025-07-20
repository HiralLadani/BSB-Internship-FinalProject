import React from "react";
import UserProfileForm from "./UserProfileForm";
import CourseCreationForm from "./CourseCreationForm";

export default function ProfessorPanel({
  principalText,
  myCourses,
  currentProfile,
  onUpdateProfile,
  onCreateCourse,
  onProposeCourse
}) {
  return (
    <div className="panel professor-panel">
      <h2>Professor Dashboard</h2>
      <UserProfileForm
        principalText={principalText}
        currentProfile={currentProfile}
        onSubmit={onUpdateProfile}
      />
      <CourseCreationForm onCreateCourse={onCreateCourse} />
       <section>
        <h3>My Courses ({myCourses.length})</h3>
        {myCourses.length > 0 ? (
          <ul>
            {myCourses.map((course) => (
              <li key={course.id}>
                <strong>{course.title}</strong> (ID: {course.id}) – Votes: {course.vote_count}
                {course.status === "Draft" && (
                  <button onClick={() => onProposeCourse(course.id)}>Propose</button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven’t created any courses yet.</p>
        )}
      </section>
    </div>
  );
}
