import React from "react";
import UserProfileForm from "./UserProfileForm";
import CourseCreationForm from "./CourseCreationForm";

export default function ProfessorPanel({
  principalText,
  myCourses,
  currentProfile,
  onUpdateProfile,
  onCreateCourse,
  onProposeCourse,
  onImageChange,
  avatarPreview,

})

{
 // console.log("[ProfessorPanel] myCourses prop:", myCourses);
 
  return (
    
    <div className="panel professor-panel">
      <h2>Professor Dashboard</h2>
      <UserProfileForm
        principalText={principalText}
        currentProfile={currentProfile}
        onSubmit={onUpdateProfile}           
        avatarPreview={avatarPreview}
        onImageChange={onImageChange}
  
      />
      <CourseCreationForm onCreateCourse={onCreateCourse} />
      
       <section>
        <h3>My Courses ({myCourses.length})</h3>
        {myCourses.length > 0 ? (
          <ul>
            {
            myCourses.map(course => (
                
                    <li key={course.id}>
                        <strong>{course.title}</strong>
                        <br />
                        (ID: {course.id}) - Status: {course.status} — Votes:{course.vote_count}
                        {course.status === "Voting" && (<span> 🎉 Ready for admin review</span>)}
                        {course.status === "Draft" && (<button onClick={() => onProposeCourse(course.id)}>Propose</button>)}
            
                    </li>
            )
            )}
          </ul>
        ) : (
          <p>You haven’t created any courses yet.</p>
        )}
      </section>
    </div>
  );
}
