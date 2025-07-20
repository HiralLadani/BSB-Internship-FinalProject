import React, { useState, useEffect } from "react";
import { Principal } from "@dfinity/principal";
import { Toaster, toast } from "react-hot-toast";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory, canisterId as backendCanisterId } from "../../declarations/duniversity_backend";

// Components
import LoginControls from "./components/LoginControls";
import AdminPanel from "./components/AdminPanel";
import ProfessorPanel from "./components/ProfessorPanel";
import StudentPanel from "./components/StudentPanel";
 
export default function App() {
  // State
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [actor, setActor] = useState(null);
  const [principalText, setPrincipalText] = useState("");
  const [role, setRole] = useState("Guest");
  const [users, setUsers] = useState([]);
  const [principalList, setPrincipalList] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [myEnrolledCourses, setMyEnrolledCourses] = useState([]);
  const [myProfile, setMyProfile] = useState(null);

  //— Environment
  const network = import.meta.env.VITE_DFX_NETWORK || "local";
  const iiCanisterId = import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID;

  function makeActor(ident) {
    const agent = new HttpAgent({ identity: ident });
    if (network === "local") agent.fetchRootKey();
    return Actor.createActor(idlFactory, {
      agent,
      canisterId: backendCanisterId,
    });
  }

  async function refreshSessionAndData(act, intendedRole) {
            if (!act) {
              setIdentity(null);
              setActor(null);
              setPrincipalText("");
              setRole("Guest");
              setUsers([]);
              setPrincipalList([]);
              setAllCourses([]);
              setMyEnrolledCourses([]);
              setMyProfile(null);
              return;
            }

              setActor(act);
                    if (!authClient) {
                  console.error("authClient not ready yet");
                  return;
                }
                  setIdentity(await authClient.getIdentity());
                  const me = (await authClient.getIdentity()).getPrincipal().toText();
                  setPrincipalText(me);

                    const resRole = intendedRole
                      ? await act.login_as_role({ [intendedRole]: null })
                      : await act.my_role();
                    const determined = Object.keys(resRole)[0];
                    setRole(determined);

                    const pfRes = await act.get_my_profile();
                    setMyProfile(pfRes.length ? pfRes[0] : null);

                    const courses = (await act.list_courses([])).map((c) => ({
                      ...c,
                      status: Object.keys(c.status)[0],      
                      professor_id: c.professor_id.toText(),
                      vote_count: c.vote_count,
                    }));
                    setAllCourses(courses);

                    if (determined === "Student") {
                      const enrolled = await act
                        .get_my_enrolled_courses()
                        .catch(() => []);
                      setMyEnrolledCourses(
                        enrolled.map((c) => ({
                          ...c,
                          status: Object.keys(c.status)[0],
                          professor_id: c.professor_id.toText(),
                        }))
                      );
                    } else {
                              setUsers(
                                (await act.list_users()).map(([p, r]) => ({
                                  principal: p.toText(),
                                  role: Object.keys(r)[0],
                                }))
                              );
                                  setPrincipalList((await act.list_principals()).map((p) => p.toText()));
                                if (determined !== "Student") {
                                  setMyEnrolledCourses([]);
                                }
                            }
  }

  // — Initial session check
  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      if (client.isAuthenticated()) {
        const act = makeActor(client.getIdentity());
        await refreshSessionAndData(act);
      }
    });
  }, []);

  // — Utility Actions
  const login = (intendedRole) => {
    const identityProvider =
      network === "local"
        ? `http://${iiCanisterId}.localhost:4943/#authorize`
        : "https://identity.ic0.app/#authorize";

    authClient.login({
      identityProvider,
      onSuccess: async () => {
        const act = makeActor(await authClient.getIdentity());
        await refreshSessionAndData(act, intendedRole);
      },
      onError: (e) => toast.error(`Login failed: ${e}`),
    });
  };
  const logout = async () => {
    await authClient.logout();
    await refreshSessionAndData(null);
    toast.success("Logged out");
  };

  // — Action handlers passed down
  const handleAssignRole = async (principal, newRole) => {
    try {
      await actor.assign_role(Principal.fromText(principal), {
        [newRole]: null,
      });
      toast.success(`Role set to ${newRole}`);
      await refreshSessionAndData(actor);
    } catch (e) {
      toast.error(`Error assigning role: ${e}`);
    }
  };

  const handleCreateOrUpdateProfile = async (pd) => {
    const payload = {
      profile_id: Principal.fromText(principalText),
      name: pd.name,
      bio: pd.bio ? [pd.bio] : [],
      contact_email: pd.contact_email ? [pd.contact_email] : [],
      github_username: pd.github_username
        ? [pd.github_username]
        : [],
    };
    try {
      await actor.create_or_update_my_profile(payload);
      toast.success("Profile saved");
      await refreshSessionAndData(actor);
    } catch (e) {
      toast.error(`Save failed: ${e}`);
    }
  };

  const handleApproveReject = async (courseId, newStatus) => {
    try {
      const result =
        newStatus === "Approved"
          ? await actor.approve_course(courseId)
          : await actor.reject_course(courseId);
      if (result.Err) throw new Error(result.Err);
      toast.success(`Course ${newStatus}`);
      await refreshSessionAndData(actor);
    } catch (e) {
      toast.error(`Change status failed: ${e}`);
    }
  };

  const handleCreateCourse = async (title, desc) => {
    try {
      await actor.create_course(title, desc);
      toast.success("Course created");
      await refreshSessionAndData(actor);
    } catch (e) {
      toast.error(`Create failed: ${e}`);
    }
  };

  const handleProposeCourse = async (courseId) => {
    try {
      await actor.propose_course(courseId);
      toast.success("Course proposed");
      await refreshSessionAndData(actor);
    } catch (e) {
      toast.error(`Propose failed: ${e}`);
    }
  };

  // const handleVoteCourse = async (courseId) => {
  //   try {
  //     await actor.vote_for_course(courseId);
  //     toast.success("Voted");
  //     await refreshSessionAndData(actor);
  //   } catch (e) {
  //     toast.error(`Voting failed: ${e}`);
  //   }
  // };
const handleVoteCourse = async (courseId) => {
  if (!actor) return toast.error("Unauthorized");

  try {
    const result = await actor.vote_for_course(courseId);
    if (result.Err) {
      toast.error(result.Err);
    } else {
      toast.success("Voted");
      // 🔁 Refresh data here:
      await refreshSessionAndData(actor);
    }
  } catch (err) {
    toast.error(err.toString());
  }
};

  const handleEnrollCourse = async (courseId) => {
    try {
      await actor.enroll_in_course(courseId);
      toast.success("Enrolled");
      await refreshSessionAndData(actor);
    } catch (e) {
      toast.error(`Enroll failed: ${e}`);
    }
  };

  return (
    <div className="app">
      <Toaster position="top-right" />
      <h1>Decentralized Autonomous University</h1>

      <LoginControls
        identity={identity}
        principalText={principalText}
        role={role}
        login={login}
        logout={logout}
      />

      {role === "Admin" && (
        <AdminPanel
          users={users}
          principalList={principalList}
          courses={allCourses}
          onChangeRole={handleAssignRole}
          onApproveRejectCourse={handleApproveReject}
        />
      )}

      {role === "Professor" && (
        <ProfessorPanel
          principalText={principalText}
          myCourses={allCourses.filter(c=> c.professor_id === principalText)}
          currentProfile={myProfile}
          onUpdateProfile={handleCreateOrUpdateProfile}
          onCreateCourse={handleCreateCourse}
          onProposeCourse={handleProposeCourse}
        />
      )}

      {role === "Student" && (
        <StudentPanel
          principalText={principalText}
          currentProfile={myProfile}
          onUpdateProfile={handleCreateOrUpdateProfile}
          coursesForVoting={allCourses.filter(
            (c) => c.status === "Proposed" || c.status === "Voting"
          )}
          approvedCourses={allCourses.filter((c) => c.status === "Approved")}
          myEnrolledCourses={myEnrolledCourses}
          onVoteCourse={handleVoteCourse}
          onEnrollCourse={handleEnrollCourse}
        />
      )}
    </div>
  );
}



// import React, { useState, useEffect } from "react";
// import { Principal } from "@dfinity/principal";  // at top
// import "./index.scss"; // Assuming you have a basic CSS file for styling
// import { Toaster, toast } from "react-hot-toast";
// import { AuthClient } from "@dfinity/auth-client";
// import { HttpAgent, Actor } from "@dfinity/agent";

// import { idlFactory, canisterId as backendCanisterId } from "../../declarations/duniversity_backend";


// // const handleCreateOrUpdateProfile = async (profileData) => {
// //   if (!actor) return toast.error("Please log in");

// //   let principalObj;
// //   try {
// //     principalObj = Principal.fromText(principalText);  // ensure correct type
// //   } catch (e) {
// //     console.error("Invalid principalText:", principalText);
// //     return toast.error("Couldn't parse your Principal ID");
// //   }

// //   const payload = {
// //       profile_id: Principal.fromText(principalText),
// //     name: profileData.name,
// //     bio: profileData.bio || null,
// //     contact_email: profileData.contact_email || null,
// //     github_username: profileData.github_username || null,
// //   };

// //   console.log("🧩 Final payload:", payload);  // verify it logs a Principal object

// //   try {
// //     await actor.create_or_update_my_profile(payload);
// //     toast.success("Profile saved!");
// //     await refreshSessionAndData(actor);
// //   } catch (err) {
// //     console.error("Profile save failed:", err);
// //     toast.error(`Save failed: ${err.message}`);
// //   }
// // };

// // --- Enums & Types from Backend (Replicated in Frontend for Type Safety) ---
// // In a real project, you'd use a shared Candid interface or dcl.js for this.
// const Role = { Admin: null, Student: null, Professor: null, Guest: null };
// const CourseStatus = { Draft: null, Proposed: null, Voting: null, Approved: null, Rejected: null, Archived: null };

// // --- Profile & Course Components (New) ---

// const UserProfileForm = ({ principalText, onSubmit, currentProfile }) => 
//   {
//   const [name, setName] = useState(currentProfile?.name ?? "");
//   const [bio, setBio] = useState(currentProfile?.bio?.[0] ?? "");
//   const [email, setEmail] = useState(currentProfile?.contact_email?.[0] ?? "");
//   const [github, setGithub] = useState(currentProfile?.github_username ?? "");
//   console.log("🌟 UserProfileForm.loaded principalText:", principalText);
//  useEffect(() => {
//   console.log("UserProfileForm currentProfile changed:", currentProfile);
//   if (currentProfile) {
//     setName(currentProfile.name);
//     // etc.
//   }
// }, [currentProfile]);

//   const handleSubmit = () => 
//     {
//       if (!name) return toast.error("Name is required");
//         onSubmit({
//               profile_id: principalText,
//               name,
//               bio,               // optional string
//               contact_email: email,
//               github_username: github,
//         });
//   };

//   return (
//     <div className="profile-form panel">
//       <h3>{currentProfile ? "Update Your Profile" : "Create Profile"}</h3>
//       <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
//       <textarea placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} />
//       <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
//       <input placeholder="GitHub Username" value={github} onChange={e => setGithub(e.target.value)} />
//       <button onClick={handleSubmit}>
//         {currentProfile ? "Update Profile" : "Save Profile"}
//       </button>
//     </div>
//   );
// };
// const CourseCreationForm = ({ onCreateCourse }) => {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const handleSubmit = () => {
//     if (!title || !description) {
//       toast.error("Course title and description are required.");
//       return;
//     }
//     onCreateCourse(title, description);
//     setTitle("");
//     setDescription("");
//   };
//   return (
//     <div className="course-form panel">
//       <h3>Create New Course</h3>
//       <input type="text" placeholder="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} />
//       <textarea placeholder="Course Description" value={description} onChange={(e) => setDescription(e.target.value)} />
//       <button onClick={handleSubmit}>Create Course</button>
//     </div>
//   );
// };

// // --- Dashboard Components ---

// const AdminPanel = ({ users, onChangeRole, principalList, courses, onApproveRejectCourse }) => {
//   const [targetPrincipal, setTargetPrincipal] = useState('');
//   const [selectedRole, setSelectedRole] = useState('Student');
//   const handleAssignRole = () => 
//     {
//     if (!targetPrincipal) { toast.error("Please enter a Principal ID."); return; }
//     onChangeRole(targetPrincipal, selectedRole);
//     setTargetPrincipal('');
//   };

//   return (
//     <div className="panel admin-panel">
//       <h2>Admin Dashboard</h2>
//       <section>
//         <h3>Assign User Roles</h3>
//         <div className="role-assignment-form">
//           <input
//             type="text"
//             placeholder="Enter User Principal ID (e.g., 2vxsx-fae)"
//             value={targetPrincipal}
//             onChange={(e) => setTargetPrincipal(e.target.value)}
//           />
//           <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
//             <option value="Student">Student</option>
//             <option value="Professor">Professor</option>
//             <option value="Admin">Admin</option>
//             <option value="Guest">Guest</option>
//           </select>
//           <button onClick={handleAssignRole}>Assign Role</button>
//         </div>
//       </section>

//       <section>
//         <h3>All Users & Their Roles ({users.length})</h3>
//         {users.length > 0 ? (
//           <ul>
//             {users.map((user) => (
//               <li key={user.principal}>
//                 <strong>{user.principal}</strong> - {user.role}
//               </li>
//             ))}
//           </ul>
//         ) : (<p>No users found or loaded.</p>)}
//       </section>

//       <section>
//         <h3>Courses for Approval ({courses.filter(c => c.status === "Proposed" || c.status === "Voting").length})</h3>
//         {courses.filter(c => c.status === "Proposed" || c.status === "Voting").length > 0 ? (
//           <ul>
//             {courses.filter(c => c.status === "Proposed" || c.status === "Voting").map(course => (
//               <li key={course.id}>
//                 <strong>{course.title}</strong> (ID: {course.id}) - Status: {course.status} - Proposed by: {course.professor_id}
//                 <br/>Votes: {course.vote_count}
//                 <div className="course-actions">
//                   <button onClick={() => onApproveRejectCourse(course.id, "Approved")} className="approve">Approve</button>
//                   <button onClick={() => onApproveRejectCourse(course.id, "Rejected")} className="reject">Reject</button>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         ) : (<p>No courses currently awaiting approval.</p>)}
//       </section>

//       <section>
//         <h3>All Courses ({courses.length})</h3>
//         {courses.length > 0 ? (
//           <ul>
//             {courses.map(course => (
//               <li key={course.id}>
//                 <strong>{course.title}</strong> (ID: {course.id}) - Status: {course.status} - Prof: {course.professor_id} - Votes: {course.vote_count} - Enrolled: {Object.keys(course.enrolled_students).length}
//               </li>
//             ))}
//           </ul>
//         ) : (<p>No courses created yet.</p>)}
//       </section>

//     </div>
//   );
// };
//  //console.log("🌟 UserProfileForm.loaded principalText:", principalText);
// const ProfessorPanel = ({ principalText, onCreateCourse, onProposeCourse, myCourses, currentProfile, onUpdateProfile }) => {
//   return (
//     <div className="panel professor-panel">
//       <h2>Professor Dashboard</h2>     
//       <UserProfileForm
//           principalText={principalText}                
//           currentProfile={currentProfile}
//           onSubmit={onUpdateProfile}
//       />
//       <CourseCreationForm onCreateCourse={onCreateCourse} />
//       <section>
//         <h3>My Courses ({myCourses.length})</h3>
//         {myCourses.length > 0 ? (
//           <ul>
//             {myCourses.map((course) => (
//               <li key={course.id}>
//                 <strong>{course.title}</strong> (ID: {course.id}) - Status: {course.status} - Votes: {course.vote_count} - Enrolled: {Object.keys(course.enrolled_students).length}
//                 {course.status === "Draft" && (
//                   <button onClick={() => onProposeCourse(course.id)} className="propose">Propose</button>
//                 )}
//               </li>
//             ))}
//           </ul>
//         ) : (<p>You haven't created any courses yet.</p>)}
//       </section>
//     </div>
//   );
// };

// const StudentPanel = ({ principalText,currentProfile, onUpdateProfile, coursesForVoting, approvedCourses, myEnrolledCourses, onVoteCourse, onEnrollCourse }) => 
//   {
//   return (
//     <div className="panel student-panel">
//       <h2>Student Dashboard</h2>
//       <UserProfileForm
//           principalText={principalText}                
//           currentProfile={currentProfile}
//           onSubmit={onUpdateProfile}
//       />

//       <section>
//         <h3>Courses Available for Voting ({coursesForVoting.length})</h3>
//         {coursesForVoting.length > 0 ? (
//           <ul>
//             {coursesForVoting.map((course) => (
//               <li key={course.id}>
//                 <strong>{course.title}</strong> - Professor: {course.professor_id}
//                 <br/>Votes: {course.vote_count}
//                 <button onClick={() => onVoteCourse(course.id)} className="vote">Vote</button>
//               </li>
//             ))}
//           </ul>
//         ) : (<p>No courses currently available for voting.</p>)}
//       </section>

//       <section>
//         <h3>Approved Courses for Enrollment ({approvedCourses.length})</h3>
//         {approvedCourses.length > 0 ? (
//           <ul>
//             {approvedCourses.map((course) => (
//               <li key={course.id}>
//                 <strong>{course.title}</strong> - Professor: {course.professor_id} - Enrolled: {Object.keys(course.enrolled_students).length}
//                 <button onClick={() => onEnrollCourse(course.id)} className="enroll">Enroll</button>
//               </li>
//             ))}
//           </ul>
//         ) : (<p>No approved courses available for enrollment.</p>)}
//       </section>

//       <section>
//         <h3>My Enrolled Courses ({myEnrolledCourses.length})</h3>
//         {myEnrolledCourses.length > 0 ? (
//           <ul>
//             {myEnrolledCourses.map((course) => (
//               <li key={course.id}>
//                 <strong>{course.title}</strong> - Professor: {course.professor_id}
//               </li>
//             ))}
//           </ul>
//         ) : (<p>You are not currently enrolled in any courses.</p>)}
//       </section>
//     </div>
//   );
// };


// // --- Main App Component ---
// export default function App() 
// {
//   const [authClient, setAuthClient] = useState(null);
//   const [identity, setIdentity] = useState(null);
//   const [actor, setActor] = useState(null);
//   const [principalText, setPrincipalText] = useState("");
//   const [role, setRole] = useState("Guest");
//   const [myCourses, setMyCourses] = useState([]); // For Professor: courses they created
//   const [users, setUsers] = useState([]); // For Admin panel: all users and their roles
//   const [principalList, setPrincipalList] = useState([]); // For Admin panel: all principals
//   const [allCourses, setAllCourses] = useState([]); // All courses for admin, filtered for others
//   const [myProfile, setMyProfile] = useState(null); // Current user's profile
//   const [myEnrolledCourses, setMyEnrolledCourses] = useState([]); // Student's enrolled courses
//    const [profile, setProfile] = useState();
//   const [form, setForm] = useState({ name: "", bio: "", email: "", github: "" });
//   // --- Config from .env ---
//   const network = import.meta.env.VITE_DFX_NETWORK || "local";
//   const iiCanisterId = import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID;

//   // --- Helper to create Actor ---
//   const makeActor = (ident) => {
//     const agent = new HttpAgent({ identity: ident });
//     if (network === "local") {
//         agent.fetchRootKey().catch(e => {
//             console.warn("Unable to fetch root key. Check if dfx is running.", e);
//         });
//     }
 
//     return Actor.createActor(idlFactory, { agent, canisterId: backendCanisterId });
//   };

//   // --- Core Session Refresh / Data Fetching ---
//   const refreshSessionAndData = async (currentActor, intendedRole ) => {
//     if (!currentActor) {
//       console.log("No actor provided to refreshSession. Resetting state.");
//       setIdentity(null);
//       setActor(null);
//       setPrincipalText("");
//       setRole("Guest");
//       setUsers([]);
//       setPrincipalList([]);
//       setAllCourses([]);
//       setMyProfile(null);
//       setMyEnrolledCourses([]);
//       //setMyCourses([]);
//       return;
//     }
// if (!authClient) {
//   console.error("authClient is null");
//   return;
// }
//     const ident = authClient.getIdentity();
//     setIdentity(ident);
//     const currentPrincipal = ident.getPrincipal();
//     setPrincipalText(currentPrincipal.toText());
//     setActor(currentActor);

//     let determinedRole = "Guest";

//     try {
//       if (intendedRole) {
//         const roleVariant = { [intendedRole]: null };
//         const resultRoleRes = await currentActor.login_as_role(roleVariant);
//         determinedRole = Object.keys(resultRoleRes)[0];
//         toast.success(`Logged in. Your role is: ${determinedRole}`);
//       } else {
//         const roleRes = await currentActor.my_role();
//         determinedRole = roleRes ? Object.keys(roleRes)[0] : "Guest";
//       }
//       setRole(determinedRole);

//       // --- Fetch Profile ---
//      const profileRes = await currentActor.get_my_profile();
//         if (profileRes.length > 0) 
//           {
//             console.log("← Fetched profile:", profileRes[0]);
//             setMyProfile(profileRes[0]);
//           } else 
//           {
//             console.log("← No profile found!");
//             setMyProfile(null);
//           }
//       // --- Fetch role-specific data ---
//       if (determinedRole === "Admin") {
//         const [loadedUsers, loadedPrincipals, coursesRes] = await Promise.all([
//           currentActor.list_users(),
//           currentActor.list_principals(),
//           currentActor.list_courses([]), // Admins can see ALL courses
//         ]);
//         setUsers(loadedUsers.map(([p, rr]) => ({
//           principal: p.toText(),
//           role: Object.keys(rr)[0],
//         })));
//         setPrincipalList(loadedPrincipals.map(p => p.toText()));
//         setAllCourses(coursesRes.map(c => ({
//           ...c,
//           status: Object.keys(c.status)[0], // Convert Candid variant to string
//           professor_id: c.professor_id.toText(),
//         })));
//         setMyEnrolledCourses([]); // Admins don't enroll in courses in this context
//       } 
//       else if (determinedRole === "Professor")
//          {
          
//           const coursesRes = await currentActor.list_courses([]); // Professors see their own drafts + proposed/approved
//           setAllCourses(coursesRes.map(c => ({
//             ...c,
//             status: Object.keys(c.status)[0],
//             professor_id: c.professor_id.toText(),
//           })));
//           setUsers([]); // Professors don't manage all users
//           setPrincipalList([]);
//          // setAllCourses
//           setMyEnrolledCourses([]); // Professors don't enroll in courses
//           await fetchAndSetCourses();
//       } else if (determinedRole === "Student") {
//           const [coursesRes, enrolledCoursesRes] = await Promise.all([
//             currentActor.list_courses([]), // Students see proposed/approved
//             currentActor.get_my_enrolled_courses().catch(() => [])
//           ]);
//           setAllCourses(coursesRes.map(c => ({
//             ...c,
//             status: Object.keys(c.status)[0],
//             professor_id: c.professor_id.toText(),
//           })));
//           setMyEnrolledCourses(enrolledCoursesRes.map(c => ({
//             ...c,
//             status: Object.keys(c.status)[0],
//             professor_id: c.professor_id.toText(),
//           })));
//           setUsers([]);
//           setPrincipalList([]);
//       } else { // Guest or other roles
//         setUsers([]);
//         setPrincipalList([]);
//         setAllCourses([]);
//         setMyEnrolledCourses([]);
//       }

//     } catch (err) {
//       console.error("Error during session refresh/data fetch:", err);
//       toast.error("Failed to load data. Please try again.");
//       setRole("Guest"); // Fallback
//       setUsers([]);
//       setPrincipalList([]);
//       setAllCourses([]);
//       setMyEnrolledCourses([]);
//     }
//   };
// const fetchAndSetCourses = async () => {
//   if (!actor) {
//   toast.error("Please log in first.");
//   return;
// }
//   const coursesRes = await actor.list_courses([]);  
//   const courses = coursesRes.map(c => ({
//     ...c,
//     status: Object.keys(c.status)[0],
//     professor_id: c.professor_id.toText(),
//   }));
//   setAllCourses(courses);
//   //setMyCourses(courses.filter(c => c.professor_id =refreshSessionAndData== principalText));
//   setMyCourses(courses.filter(c => c.professor_id === principalText));
// };
//   // --- Initialize AuthClient ---
//   useEffect(() => {
//     AuthClient.create().then(client => {
//       setAuthClient(client);
//       if (client.isAuthenticated()) {
//         const ident = client.getIdentity();
//         const act = makeActor(ident);
//         refreshSessionAndData(act);
//       }
//     });
//   }, []);
// useEffect(() => {
//   if (actor && role === 'Professor') {
//     fetchAndSetCourses();
//   }
// }, [actor, role]);

//   // --- Login / Logout Functions ---
//   const login = (intendedRole) => {
//     console.log(`🔐 Calling authClient.login for ${intendedRole}…`);
//     const identityProviderUrl = network === "local"          
//           ? `http://${iiCanisterId}.localhost:4943/#authorize`
//           :"https://identity.ic0.app/#authorize";
//     //console.log(🔐 Calling`` authClient.login for ${intendedRole}…``);
//     // const identityProviderUrl = network === "local"
//     //   ? http://${iiCanisterId}.localhost:4943/?canisterId=${iiCanisterId}
//     //   : "https://identity.ic0.app/";

//     authClient?.login({
//       identityProvider: identityProviderUrl,
//       onSuccess: async () => {
//         const ident = await authClient.getIdentity();
//         const act = makeActor(ident);
      
//         setActor(act);
//         await refreshSessionAndData(act, intendedRole);
//          await fetchAndSetCourses();
        
//       },
//       onError: (err) => {
//         console.error("Login failed:", err);
//         toast.error("Login failed. Please check console for details.");
//       },
//     });
//   };

//   const logout = async () => {
//     console.log("🔐 Calling authClient.logout…");
//     await authClient?.logout();
//     refreshSessionAndData(null); // Clear all data
//     toast.success("Logged out successfully.");
//   };

//   // --- Admin Specific Actions ---
//   const handleAssignRole = async (principalTxt, newRole) => {
 
//     if (!actor || role !== "Admin") { toast.error("Unauthorized: Must be an Admin."); return; }
//     try {
//       const roleVariant = { [newRole]: null };
//       await actor.assign_role(Principal.fromText(principalTxt), roleVariant);
//       toast.success(`Role updated to ${newRole} for ${principalTxt}`);
//       await refreshSessionAndData(actor); // Re-fetch all data
//     } catch (err) {
//       console.error("assign_role failed:", err);
//       toast.error(`Failed to assign role: ${err?.message || "Unknown error"}`);
//     }
//   };

//   const handleApproveRejectCourse = async (courseId, newStatus) => {

//     if (!actor || role !== "Admin") { toast.error("Unauthorized: Must be an Admin."); return; }
//     try {
//       let result;
//       if (newStatus === "Approved") {
//         result = await actor.approve_course(courseId);
//       } else if (newStatus === "Rejected") {
//         result = await actor.reject_course(courseId);
//       } else {
//         toast.error("Invalid status for approval/rejection.");
//         return;
//       }
//       if (result.Err) {
//         toast.error(`Failed to change course status: ${result.Err}`);
//       } else {
//         toast.success(`Course ${courseId} ${newStatus.toLowerCase()} successfully!`);
//         await refreshSessionAndData(actor);
//       }
//     } catch (err) {
//       console.error("Approve/Reject Course failed:", err);
//       toast.error(`Failed to approve/reject course: ${err?.message || "Unknown error"}`);
//     }
//   };

//   // --- Profile Actions ---
// const handleCreateOrUpdateProfile = async (profileData) => {
//   if (!actor) return toast.error("Please log in");
//   const payload = {
//   profile_id: Principal.fromText(principalText),
//   name: profileData.name,
//   bio: profileData.bio ? [profileData.bio] : [],                // ✅ wrap in array
//   contact_email: profileData.contact_email ? [profileData.contact_email] : [],
//   github_username: profileData.github_username ? [profileData.github_username] : [],
// };
//   console.log("➡️ Profile payload:", payload);
//     console.log("🧩 About to call create_or_update_my_profile with:", payload);
//   try {
//     await actor.create_or_update_my_profile(payload);
//     toast.success("Profile saved!");
//     await refreshSessionAndData(actor);
//   } catch (err) {
//     console.error("Profile save failed:", err);
//     toast.error(`Save failed: ${err.message}`);
//   }
// };



//   // --- Professor Actions ---
//   const handleCreateCourse = async (title, description) => {
//     if (!actor || role !== "Professor") { toast.error("Unauthorized: Must be a Professor."); return; }
//     try {
//       const result = await actor.create_course(title, description);
//         if (result.Err) {
//           toast.error(`Failed to create course: ${result.Err}`);
//         } else {
//           toast.success(`Course "${result.Ok.title}" created!`);
//             await actor.create_course(title, description);
//             await fetchAndSetCourses();
//           // Refresh session and data to show new course
//                 if (!identity) {
//                     console.error("No identity found. Cannot refresh session.");
//                     return;
//                }
//           const coursesRes = await actor.list_courses([]);
//           const allCourses = coursesRes.map(c => ({
//             ...c,
//             status: Object.keys(c.status)[0], // Convert Candid variant to string
//             professor_id: c.professor_id.toText(),
//           }));
//           setAllCourses(allCourses);
//           setMyCourses(allCourses.filter(c => c.professor_id === principalText)); // Update professor's courses
//           console.log("Fetched courses after creation:", coursesRes);
//           console.log("All courses after creation:", allCourses);
//           console.log("My courses after creation:", allCourses.filter(c => c.professor_id === principalText));
//           // Optionally, refresh profile if needed
//           await refreshSessionAndData(actor);
//           //console.log("Fetched courses after creation:", coursesRes);
//           console.log("Refreshed allCourses:", allCourses);
//           console.log("Filtered myCourses:", allCourses.filter(c => c.professor_id === principalText));
//         }
//     } catch (err) {
//       console.error("Create course failed:", err);
//       toast.error(`Failed to create course: ${err?.message || "Unknown error"}`);
//     }
    
//   };

//   const handleProposeCourse = async (courseId) => {
//     if (!actor || role !== "Professor") { toast.error("Unauthorized: Must be a Professor."); return; }
//     try {
//       const result = await actor.propose_course(courseId);
//       if (result.Err) {
//         toast.error(`Failed to propose course: ${result.Err}`);
//       } else {
//         toast.success(`Course "${result.Ok.title}" proposed for voting!`);
//         await refreshSessionAndData(actor);
//         await fetchAndSetCourses();
//       }
//     } catch (err) {
//       console.error("Propose course failed:", err);
//       toast.error(`Failed to propose course: ${err?.message || "Unknown error"}`);
//     }
//   };

//   // --- Student Actions ---
//   const handleVoteCourse = async (courseId) => {
//     if (!actor || role !== "Student") { toast.error("Unauthorized: Must be a Student."); return; }
//     try {
//       const result = await actor.vote_for_course(courseId);
//       if (result.Err) {
//         toast.error(`Failed to vote: ${result.Err}`);
//       } else {
//         toast.success(`Voted for course "${result.Ok.title}"!`);
//         await refreshSessionAndData(actor);
//       }
//     } catch (err) {
//       console.error("Vote course failed:", err);
//       toast.error(`Failed to vote for course: ${err?.message || "Unknown error"}`);
//     }
//   };

//   const handleEnrollCourse = async (courseId) => {
//     if (!actor || role !== "Student") { toast.error("Unauthorized: Must be a Student."); return; }
//     try {
//       const result = await actor.enroll_in_course(courseId);
//       if (result.Err) {
//         toast.error(`Failed to enroll: ${result.Err}`);
//       } else {
//         toast.success(`Enrolled in course "${result.Ok.title}"!`);
//         await refreshSessionAndData(actor);
//       }
//     } catch (err) {
//       console.error("Enroll course failed:", err);
//       toast.error(`Failed to enroll in course: ${err?.message || "Unknown error"}`);
//     }
//   };


//   return (
//     <div className="app">
//       <Toaster position="top-right" />
//       <h1>Decentralized Autonomous University</h1>

//       <div className="auth-section">
//         {!identity ? (
//           <div className="login-options">
//             <p>Login to Daouniversy as:</p>
//             <button onClick={() => login('Admin')} className="login-button admin">
//               Login as Admin
//             </button>
//             <button onClick={() => login('Professor')} className="login-button professor">
//               Login as Professor
//             </button>
//             <button onClick={() => login('Student')} className="login-button student">
//               Login as Student
//             </button>
//           </div>
//         ) : (
//           <>
//             <p>
//               Logged in as <strong>{principalText}</strong> (<em>Actual Role: {role}</em>)
//             </p>
//             <button onClick={logout} className="logout-button">Logout</button>
//           </>
//         )}
//       </div>

//       {role === "Admin" && (
//         <AdminPanel
//           users={users}
//           onChangeRole={handleAssignRole}
//           principalList={principalList}
//           courses={allCourses} // Admin sees all courses
//           onApproveRejectCourse={handleApproveRejectCourse}
//         />
//       )}

//       {role === "Professor" && (
//         <ProfessorPanel
//           onCreateCourse={handleCreateCourse}
//           onProposeCourse={handleProposeCourse}
//           myCourses={allCourses.filter(c => c.professor_id === principalText)}
//           currentProfile={myProfile}
//           principalText={principalText}               // NEW
//           onUpdateProfile={handleCreateOrUpdateProfile}
//         />
//       )}

//       {role === "Student" && (
//         <StudentPanel
//           currentProfile={myProfile}
//           onUpdateProfile={handleCreateOrUpdateProfile}
//           coursesForVoting={allCourses.filter(c => c.status === "Proposed" || c.status === "Voting")}
//           approvedCourses={allCourses.filter(c => c.status === "Approved")}
//           myEnrolledCourses={myEnrolledCourses}
//           onVoteCourse={handleVoteCourse}
//           onEnrollCourse={handleEnrollCourse}
//         />
//       )}

//       {role === "Guest" && !identity && (
//           <div className="panel guest-panel">
//             <h2>Welcome!</h2>
//             <p>Please select a role to log in. Your actual role will be determined by the system.</p>
//           </div>
//       )}

//       {role === "Guest" && identity && (
//           <div className="panel guest-panel">
//             <h2>Hello, Guest!</h2>
//             <p>You are logged in, but currently have the Guest role. An administrator can assign you a specific role (Student, Professor, or Admin).</p>
//             <p>Your Principal: {principalText}</p>
//           </div>
//       )}
//     </div>
//   );
// }

