// this is my StudentPanel component
import React from "react";
import UserProfileForm from "./UserProfileForm";
import CourseSuggestionForm from "./CourseSuggestionForm";
export default function StudentPanel({
  principalText,
  currentProfile,
  onUpdateProfile,
  coursesForVoting=[],
  suggestedCourses=[],
  onSuggestedCourse,
  approvedCourses=[],
  myEnrolledCourses=[],
  onVoteCourse,
  onSuggestionCourse,
  onVoteSuggestedCourse,
  votingInProgress = false,
  onEnrollCourse,
  onImageChange,
  avatarPreview,
}) {
  return (
    <div className="panel student-panel">
      <h2>Student Dashboard</h2>
      <UserProfileForm
        principalText={principalText}
        currentProfile={currentProfile}
        onSubmit={onUpdateProfile}
       avatarPreview={avatarPreview}
        onImageChange={onImageChange}
      />
 <CourseSuggestionForm onSuggestionCourse={onSuggestionCourse} />
     <section>
  <h3>Suggested Courses</h3>
  <ul>
    {suggestedCourses.map((c) => (
      <li key={c.id}>
        <strong>{c.title}</strong>
        <button
          onClick={() => onVoteSuggestedCourse(c.id)}
           disabled={c.hasVoted}
        >
         {c.hasVoted ? "Already Voted" : "Vote"}
         
        </button>
      </li>
    ))}
  </ul>
</section>
<section>
        <h3>Voting Courses</h3>
        <ul>
                  {coursesForVoting.map((c) => (
                    <li key={c.id}>
                      <strong>{c.title}</strong> – {c.professor_id}
                      {/* <button onClick={() => onVoteCourse(c.id)}>Vote</button> */}
                    <button onClick={() => onVoteCourse(c.id)}  disabled={c.hasVoted || c.status !== "Voting"}>
                        {/* {c.hasVoted ? "Already Voted" : votingInProgress ? "Voting..." : "Vote"} */}
                     {c.hasVoted
            ? "Already Voted"
            : c.status === "Voting"
            ? "Vote"
            : "Not Available"}
                    </button>
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
