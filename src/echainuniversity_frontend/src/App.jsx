// //this is my App component
// import React, { useState, useEffect } from "react";
// import { Principal } from "@dfinity/principal";
// import toast, { Toaster } from 'react-hot-toast';
// import { AuthClient } from "@dfinity/auth-client";
// import { HttpAgent, Actor } from "@dfinity/agent";
// import { idlFactory, canisterId as backendCanisterId } from "../../declarations/echainuniversity_backend";

// // Components
// import LoginControls from "./components/LoginControls";
// import AdminPanel from "./components/AdminPanel";
// import ProfessorPanel from "./components/ProfessorPanel";
// import StudentPanel from "./components/StudentPanel";
 
// export default function App() {
//   // State
//   const [authClient, setAuthClient] = useState(null);
//   const [identity, setIdentity] = useState(null);
//   const [actor, setActor] = useState(null);
//   const [principalText, setPrincipalText] = useState("");
//   const [role, setRole] = useState("Guest");
//   const [users, setUsers] = useState([]);
//   const [principalList, setPrincipalList] = useState([]);
//   const [allCourses, setAllCourses] = useState([]);
//   const [myEnrolledCourses, setMyEnrolledCourses] = useState([]);
//   const [myProfile, setMyProfile] = useState(null);
// //const [votingInProgress, setVotingInProgress] = useState(false);
// const [votingInProgress, setVotingInProgress] = useState(false);
//   //— Environment
//   const network = import.meta.env.VITE_DFX_NETWORK || "local";
//   const iiCanisterId = import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID;

//   function makeActor(ident) {
//     const agent = new HttpAgent({ identity: ident });
//     if (network === "local") agent.fetchRootKey();
//     return Actor.createActor(idlFactory, {
//       agent,
//       canisterId: backendCanisterId,
//     });
//   }

 
// async function refreshSessionAndData(act, intendedRole) {
//   if (!act) {
//     // Reset all state
//     setIdentity(null);
//     setActor(null);
//     setPrincipalText("");
//     setRole("Guest");
//     setUsers([]);
//     setPrincipalList([]);
//     setAllCourses([]);
//     setMyEnrolledCourses([]);
//     setMyProfile(null);
//     return;
//   }

//   setActor(act);
//   if (!authClient) {
//     console.error("authClient not ready yet");
//     return;
//   }

//   const identity = await authClient.getIdentity();
//   setIdentity(identity);
//   const principalTextVal = identity.getPrincipal().toText();
//   setPrincipalText(principalTextVal);

//   // Determine role (Professor, Admin, Student, etc.)
// // let roleRes = await act.my_role();
// // console.log("roleRes →", roleRes);

// // if (!roleRes || Object.keys(roleRes)[0] === "Guest") {
// //   // First-time or fallback: register as Guest (if that's allowed)
// //   await act.login_as_role({ Guest: null });
// //   roleRes = await act.my_role();
// // }
// // console.log(">> caller principal:", identity.getPrincipal().toText());
// // console.log(">> Backend role response:", roleRes);

// // console.log("roleRes:", roleRes);
// // const determined = Object.keys(roleRes)[0];
// // setRole(determined);
// let roleRes = await act.my_role();
// const currentRole = Object.keys(roleRes)[0];
// if (currentRole === "Guest") {
//   await act.login_as_role({ Guest: null });
//   roleRes = await act.my_role();
// }
// setRole(Object.keys(roleRes)[0]);
//   // Load profile and all courses
//   const profileArr = await act.get_my_profile();
//   setMyProfile(profileArr.length > 0 ? profileArr[0] : null);

//   const rawCourses = await act.list_courses([]);
//   console.log("🔄 [DEBUG] rawCourses:", rawCourses);
//   // const normalized = (rawCourses||[]).map(c => ({
//   //   ...c,
//   //   status: Object.keys(c.status)[0],
//   //   professor_id: c.professor_id.toText(),
//   //   //vote_count: c.vote_count,
//   //    vote_count: Number(c.vote_count),
//   //    hasVoted: !!c.voters?.[principalTextVal],
//   // }));
//   const normalized = (rawCourses || []).map((c) => {
//   const votersVec = c.voters || [];
//   const voterSet = new Set(
//     votersVec.map(([principal, _]) => principal.toText())
//   );

//   return {
//     ...c,
//     status: Object.keys(c.status)[0],
//     professor_id: c.professor_id.toText(),
//     vote_count: Number(c.vote_count),
//     hasVoted: voterSet.has(principalTextVal),
//   };
// });
//   console.log("🔄 [DEBUG] normalized courses:", normalized);
//   setAllCourses(normalized);

//   // Role-specific behavior
//   if (determined === "Student") {
//     // Students see only their enrolled courses
//     const enrolled = await act.get_my_enrolled_courses().catch(() => []);
//     setMyEnrolledCourses((enrolled||[]).map(c => ({
//       ...c,
//       status: Object.keys(c.status)[0],
//       professor_id: c.professor_id.toText(),
//     })));
//     setUsers([]);
//     setPrincipalList([]);

//   } else if (determined === "Professor") {
//     // Professors don’t see user lists or principals
//     setMyEnrolledCourses([]);
//     setUsers([]);
//     setPrincipalList([]);

//   } else if (determined === "Admin") {
//     // Admins fetch full user/principal lists
//     try {
//       const rawUsers = await act.list_users();
//       console.log("App users:", rawUsers);
//       setUsers((rawUsers||[]).map(([p, r]) => ({
//         principal: p.toText(),
//         role: Object.keys(r)[0],
//       })));
//     } catch (err) {
//       console.error("list_users() failed:", err);
//       setUsers([]);
//     }

//     try {
//       const principals = await act.list_principals();
//       setPrincipalList((principals||[]).map(p => p.toText()));
//     } catch (err) {
//       console.error("list_principals() failed:", err);
//       setPrincipalList([]);
//     }

//     setMyEnrolledCourses([]);

//   } else {
//     // Fallback: clear everything
//     setMyEnrolledCourses([]);
//     setUsers([]);
//     setPrincipalList([]);
//   }
// }


//   // — Initial session check
//   // useEffect(() => {
//   //   AuthClient.create().then(async (client) => {
//   //     setAuthClient(client);
//   //     if (client.isAuthenticated()) {
//   //       const act = makeActor(client.getIdentity());
//   //       await refreshSessionAndData(act);
//   //     }
//   //   });
//   // }, []);
// useEffect(() => {
//   const initAuth = async () => {
//     const client = await AuthClient.create();
//     const ident = client.getIdentity();

//     if (client.isAuthenticated()) {
//       const act = makeActor(ident);
//       await refreshSessionAndData(act);
//     }

//     setAuthClient(client); // ✅ Set only after done
//   };

//   initAuth();
// }, []);

//   // — Utility Actions
//   const login = (intendedRole) => {
//     const identityProvider =
//       network === "local"
//         ? `http://${iiCanisterId}.localhost:4943/#authorize`
//         : "https://identity.ic0.app/#authorize";

//     authClient.login({
//       identityProvider,
//       onSuccess: async () => {
//         const act = makeActor(await authClient.getIdentity());
//         await refreshSessionAndData(act, intendedRole);
//       },
//       onError: (e) => toast.error(`Login failed: ${e}`),
//     });
//   };
//   const logout = async () => {
//     await authClient.logout();
//     await refreshSessionAndData(null);
//     toast.success("Logged out");
//   };

//   // — Action handlers passed down
//   const handleAssignRole = async (principal, newRole) => {
//     try {
//       await actor.assign_role(Principal.fromText(principal), {
//         [newRole]: null,
//       });
//       toast.success(`Role set to ${newRole}`);
//       await refreshSessionAndData(actor);
//     } catch (e) {
//       toast.error(`Error assigning role: ${e}`);
//     }
//   };

//   const handleCreateOrUpdateProfile = async (pd) => {
//     const payload = {
//       profile_id: Principal.fromText(principalText),
//       name: pd.name,
//       bio: pd.bio ? [pd.bio] : [],
//       contact_email: pd.contact_email ? [pd.contact_email] : [],
//       github_username: pd.github_username
//         ? [pd.github_username]
//         : [],
//     };
//     try {
//       await actor.create_or_update_my_profile(payload);
//       if (avatarBytes) {
//   await actor.upload_my_profile_image(Array.from(avatarBytes), avatarMime);
// }
//       toast.success("Profile saved");
//       await refreshSessionAndData(actor);
//     } catch (e) {
//       toast.error(`Save failed: ${e}`);
//     }
//   };
// const handleImageChange= async (e)=> {
//   const file = e.target.files?.[0];
//   if (!file || !file.type.startsWith("image/")) { toast.error("Select an image"); return; }
//   const imgBitmap = await createImageBitmap(file);
//   const canvas = document.createElement('canvas');
//   const maxW = 512;
//   const ratio = imgBitmap.width / imgBitmap.height;
//   canvas.width = maxW; canvas.height = maxW / ratio;
//   const ctx = canvas.getContext('2d');
//   ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);
//   const blob = await new Promise(res => canvas.toBlob(res, file.type || "image/png", 0.8));
//   const u8 = new Uint8Array(await blob.arrayBuffer());
//   const url = URL.createObjectURL(blob);
//   setAvatarBytes(u8); setAvatarMime(blob.type); setAvatarPreview(url);
// }
//   const handleApproveReject = async (courseId, newStatus) => {
//     try {
//       const result =
//         newStatus === "Approved"
//           ? await actor.approve_course(courseId)
//           : await actor.reject_course(courseId);
//       if (result.Err) throw new Error(result.Err);
//       toast.success(`Course ${newStatus}`);
//       await refreshSessionAndData(actor);
//     } catch (e) {
//       toast.error(`Change status failed: ${e}`);
//     }
//   };

//   const handleCreateCourse = async (title, desc) => {
//     try {
//       await actor.create_course(title, desc);
//       toast.success("Course created");
//       await refreshSessionAndData(actor);
//     } catch (e) {
//       toast.error(`Create failed: ${e}`);
//     }
//   };
//   const handleSuggestionCourse = async (title, desc) => {
//     try {
//       await actor.suggest_course(title, desc);
//       toast.success("Course Suggestion done");
//       await refreshSessionAndData(actor);
//     } catch (e) {
//       toast.error(`Suggestion failed: ${e}`);
//     }
//   };
//   const handleProposeCourse = async (courseId) => {
//     try {
//       await actor.propose_course(courseId);
//       toast.success("Course proposed");
//       await refreshSessionAndData(actor);
//     } catch (e) {
//       toast.error(`Propose failed: ${e}`);
//     }
//   };


// // const handleVoteCourse = async (courseId) => {
// //    if (course?.hasVoted) {
// //     toast.error("You have already voted for this course.");
// //     return;
// //   }

// //   try {
// //     await actor.vote_for_course(courseId);
// //      toast.success("Voted successfully!");
// //     // 🔁 Refresh data:
// //     const courses = await actor.list_courses([]);
// //      console.log("👉 [DEBUG] fetched courses after vote:", courses);
// //     // setAllCourses((courses||[]).map(c => ({
// //     //   ...c,
// //     //   status: Object.keys(c.status)[0],
// //     //   professor_id: c.professor_id.toText(),
// //     //   hasVoted: true
// //     // })));
// //      setAllCourses((prevCourses) =>
// //       (prevCourses || []).map((c) =>
// //         c.id === courseId
// //           ? {
// //               ...c,
// //               vote_count: c.vote_count + 1, // update vote count if needed
// //               hasVoted: true,                // disable button
// //             }
// //           : c
// //       )
// //     );
    
// //      await refreshSessionAndData(actor);
// //   } catch (e) {
// //     toast.error(`Vote failed: ${e}`);
// //   }
// // };
// const handleVoteCourse = async (courseId) => {
//   const course = (allCourses || []).find((c) => c.id === courseId);
//   if (course?.hasVoted) {
//     toast.error("You have already voted for this course.");
//     return;
//   }
//   setVotingInProgress(true);
//   try {
//     // await actor.vote_for_course(courseId);
//     // toast.success("Voted successfully!");
//     const res = await actor.vote_for_course(courseId);
//     // If Candid Result variant
//     if (res && res.Err) {
//       toast.error(`Vote failed: ${res.Err}`);
//       return;
//     }    // Otherwise success
//     toast.success("Voted successfully!");
//     setAllCourses((prev=[]) =>
//       prev.map(c =>
//         c.id === courseId
//           ? { ...c, vote_count: Number(c.vote_count || 0) + 1, hasVoted: true }//{ ...c, vote_count: c.vote_count + 1, hasVoted: true }
//           : c
//       )
//     );
//     await refreshSessionAndData(actor);
//   } catch (e) {
//     toast.error(`Vote failed: ${e}`);
//   } finally {
//     setVotingInProgress(false);
//   }
// };
// const handleSuggestedVoteCourse = async (courseId) => {
//   const course = allCourses.find((c) => c.id === courseId);
//   if (course?.hasVoted) {
//     toast.error("You have already voted for this course.");
//     return;
//   }
//   setVotingInProgress(true);
//   try {
//     // await actor.vote_for_suggest_course(courseId);
//     // toast.success("Voted successfully!");
//      const res = await actor.vote_for_course(courseId);
//     // If Candid Result variant
//     if (res && res.Err) {
//       toast.error(`Vote failed: ${res.Err}`);
//       return;
//     }    // Otherwise success
//     toast.success("Voted successfully!");
//     setAllCourses((prev=[]) =>
//       prev.map(c =>
//         c.id === courseId
//           ? { ...c, vote_count: Number(c.vote_count || 0) + 1, hasVoted: true }//{ ...c, vote_count: c.vote_count + 1, hasVoted: true }
//           : c
//       )
//     );
//     console.log(c.title, c.status, c.hasVoted);
//   } catch (e) {
//     toast.error(`Vote failed: ${e}`);
//   } finally {
//     setVotingInProgress(false);
//   }
// };
//   const handleEnrollCourse = async (courseId) => {
//     try {
//       await actor.enroll_in_course(courseId);
//       toast.success("Enrolled");
//       await refreshSessionAndData(actor);
//     } catch (e) {
//       toast.error(`Enroll failed: ${e}`);
//     }
//   };

//   return (
//     <div className="app">
//       <Toaster position="top-right" />
//       <h1>Decentralized Autonomous University</h1>

//       <LoginControls
//         identity={identity}
//         principalText={principalText}
//         role={role}
//         login={login}
//         logout={logout}
//       />

//       {role === "Admin" && (
//         <AdminPanel
//           users={users}
//           principalList={principalList}
//           courses={allCourses}
//           onChangeRole={handleAssignRole}
//           onApproveRejectCourse={handleApproveReject}
//         />
//       )}

//       {role === "Professor" && (
//         <ProfessorPanel
//           principalText={principalText}
//           myCourses={allCourses||[].filter((c)=> c.professor_id === principalText)}          
//           onUpdateProfile={handleCreateOrUpdateProfile}
//           onCreateCourse={handleCreateCourse}
//           onProposeCourse={handleProposeCourse}
//         />
//       )}

//       {role === "Student" && (
//         <StudentPanel
//           principalText={principalText}
//           currentProfile={myProfile}
//           onUpdateProfile={handleCreateOrUpdateProfile}
//            onSuggestionCourse={handleSuggestionCourse}
//           // onSuggestedCourse={allCourses.filter((c) => c.status === "Suggest")}
//           suggestedCourses={(allCourses || []).filter((c) => c.status === "Suggest")}
//           coursesForVoting={(allCourses||[]).filter((c) => c.status === "Proposed" || c.status === "Voting")}
//           approvedCourses={(allCourses||[]).filter((c) => c.status === "Approved")}
//           myEnrolledCourses={myEnrolledCourses}
//           votingInProgress={votingInProgress}
//           onVoteSuggestedCourse={handleSuggestedVoteCourse}
//           onVoteCourse={handleVoteCourse}
//           onEnrollCourse={handleEnrollCourse}
//         />
//       )}
//     </div>
//   );
// }


//this is my App component
import React, { useState, useEffect } from "react";
import { Principal } from "@dfinity/principal";
import toast, { Toaster } from 'react-hot-toast';
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory, canisterId as backendCanisterId } from "../../declarations/echainuniversity_backend";
import LoginControls from "./components/LoginControls";
import AdminPanel from "./components/AdminPanel";
import ProfessorPanel from "./components/ProfessorPanel";
import StudentPanel from "./components/StudentPanel";
 
export default function App() 
{
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
  const [votingInProgress, setVotingInProgress] = useState(false);
 const [avatarBytes, setAvatarBytes] = useState(null);
 const [avatarMime, setAvatarMime] = useState(null);

 const [avatarPreview, setAvatarPreview] = useState("");
const [preview, setPreview] = useState("");

  const network = import.meta.env.VITE_DFX_NETWORK || "local";
  const iiCanisterId = import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID;
//   useEffect(() => {
//   setPreview(avatarPreview);
//     console.log("👀 Avatar preview in component:", avatarPreview);

// }, [avatarPreview]);

  function makeActor(ident) 
  {
    const agent = new HttpAgent({ identity: ident });
    if (network === "local") agent.fetchRootKey();
    return Actor.createActor(idlFactory, {
      agent,
      canisterId: backendCanisterId,
    });
  } 
//  function uint8ToBase64(bytes) {
//   let binary = "";
//   for (let i = 0; i < bytes.length; i++) {
//     binary += String.fromCharCode(bytes[i]);
//   }
//   return btoa(binary);
// }
function uint8ToBase64(bytes) {
    const CHUNK_SIZE = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, i + CHUNK_SIZE);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }


async function refreshSessionAndData(act, intendedRole) 
{
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
      if (!authClient) 
        {
          console.error("authClient not ready yet");
          return;  
        }
    const identity = await authClient.getIdentity();
    setIdentity(identity);
    const principalTextVal = identity.getPrincipal().toText();
    setPrincipalText(principalTextVal);
    let roleRes = await act.my_role();
    const determined = Object.keys(roleRes)[0];
    const currentRole = Object.keys(roleRes)[0];
    if (currentRole === "Guest") 
    {
      await act.login_as_role({ Guest: null });
      roleRes = await act.my_role();
    }
    setRole(Object.keys(roleRes)[0]);
//   const profileArr = await act.get_my_profile();
//   let profile = profileArr.length > 0 ? profileArr[0] : null;
//    console.log("Profile avatar:", profile?.avatar);
// if (profile) {
//   try {
//     const imageRes = await act.get_profile_image_info(); // or get_avatar()
//     if (imageRes && imageRes.avatar && imageRes.mime) {
//       profile.avatar = imageRes.avatar;
//       profile.avatar_mime = imageRes.mime;
//             // ✅ Set avatarPreview from fetched image
//       const byteArray = Array.isArray(imageRes.avatar)
//         ? imageRes.avatar
//         : Uint8Array.from(atob(imageRes.avatar), c => c.charCodeAt(0));
//       const base64 = btoa(String.fromCharCode(...byteArray));
//       setPreview(`data:${imageRes.mime};base64,${base64}`);

//     }
 

//   } catch (err) {
//     console.warn("Image fetch failed:", err);
//   }
// }
// setMyProfile(profile);
// console.log("Profile after login:", profile);

const profileArr = await act.get_my_profile();
const profile = profileArr.length > 0 ? profileArr[0] : null;
setMyProfile(profile);

// if (profile?.avatar?.[0] && profile?.avatar_mime?.[0]) {
//   try {
//     const byteArray = profile.avatar[0]; // already Uint8Array
//     const mime = profile.avatar_mime[0];
//     const base64 = btoa(
//       Array.from(byteArray).map((byte) => String.fromCharCode(byte)).join("")
//     );
//     setPreview(`data:${mime};base64,${base64}`);
//     console.log("✅ Avatar preview set after login");
//   } catch (err) {
//     console.warn("⚠️ Failed to decode avatar:", err);
//   }
// } else {
//   console.log("⚠️ No avatar data found in profile");
// }
if (profile?.avatar?.[0] && profile?.avatar_mime?.[0]) {
console.log("Avatar byte length:", profile.avatar[0]?.length);
console.log("Avatar MIME type:", profile.avatar_mime[0]);
console.log("🖼️ Final preview src:", preview);

console.log("Profile avatar:", profile?.avatar);
  try {
    const byteArray = profile.avatar[0]; // already Uint8Array
    const mime = profile.avatar_mime[0];
    const base64 = uint8ToBase64(byteArray);
    setPreview(`data:${mime};base64,${base64}`);
    console.log("✅ Avatar preview set after login");
  } catch (err) {
    console.warn("⚠️ Failed to decode avatar:", err);
  }
} else {
  console.log("⚠️ No avatar data found in profile");
  setPreview(""); // optional fallback

}

console.log("Profile after login:", profile);
setMyProfile(profile);

  const rawCourses = await act.list_courses([]);
  console.log("🔄 [DEBUG] rawCourses:", rawCourses);
  const normalized = (rawCourses || []).map((c) => 
    {
      const votersVec = c.voters || [];
      const voterSet = new Set(votersVec.map(([principal, _]) => principal.toText()));
      return {
        ...c,
        status: Object.keys(c.status)[0],
        professor_id: c.professor_id.toText(),
        vote_count: Number(c.vote_count),
        hasVoted: voterSet.has(principalTextVal),
      };
    });
  console.log("🔄 [DEBUG] normalized courses:", normalized);
  setAllCourses(normalized);  
        if (determined === "Student")
           {
            const enrolled = await act.get_my_enrolled_courses().catch(() => []);
            setMyEnrolledCourses((enrolled||[]).map(c => 
            ({
                ...c,
                status: Object.keys(c.status)[0],
                professor_id: c.professor_id.toText(),
              })));
          setUsers([]);
          setPrincipalList([]);
        } else if (determined === "Professor") 
          {
          setMyEnrolledCourses([]);
          setUsers([]);
          setPrincipalList([]);
        } else if (determined === "Admin") 
          {
            try {
              const rawUsers = await act.list_users();
              console.log("App users:", rawUsers);
              setUsers(rawUsers.map(([p, r]) => 
                ({
                principal: p.toText(),
                role: Object.keys(r)[0],
                })));
              } catch (err) {
                console.error("list_users() failed:", err);
                setUsers([]);
              }
            try {
              const principals = await act.list_principals();
              setPrincipalList((principals||[]).map(p => p.toText()));
            } catch (err) {
              console.error("list_principals() failed:", err);
              setPrincipalList([]);
            }
            setMyEnrolledCourses([]);
          } else 
          {
            setMyEnrolledCourses([]);
            setUsers([]);
            setPrincipalList([]);
          }
}

useEffect(() => {
  const initAuth = async () => {
    const client = await AuthClient.create();
    const ident = client.getIdentity();
    if (client.isAuthenticated()) {
      const act = makeActor(ident);
      await refreshSessionAndData(act);
    }
    setAuthClient(client); 
  };

  initAuth();
}, []);
  const login = (intendedRole) => 
    {
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
      // 🧹 Clear all user-specific state
 setPrincipalText("");
  setAvatarPreview(null);
  setAvatarBytes(null);
  setAvatarMime(null);
  setMyProfile(null);
setPreview(null);

 // if you're storing identity separately
  //setPrincipal(null); // optional, if used
    await refreshSessionAndData(null);
    toast.success("Logged out");
  };
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

  const handleCreateOrUpdateProfile = async (pd) => 
    {
    const payload = 
    {
      profile_id: Principal.fromText(principalText),
      name: pd.name,
      bio: pd.bio ? [pd.bio] : [],
      contact_email: pd.contact_email ? [pd.contact_email] : [],
      github_username: pd.github_username ? [pd.github_username] : [],   
      avatar: avatarBytes ? [Array.from(avatarBytes)] : [], // ✅ opt blob
      avatar_mime: avatarMime ? [avatarMime] : [], // ✅ opt text

    };
  console.log("Final payload:", payload);
  console.log("Payload for profile update:", payload);
console.log("Submitting profile payload:", {
  avatar_mime: avatarMime ? [avatarMime] : [],
  avatar: avatarBytes ? [Array.from(avatarBytes)] : [],
});

    try 
    {
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
  const handleSuggestionCourse = async (title, desc) => {
    try {
      await actor.suggest_course(title, desc);
      toast.success("Course Suggestion done");
      await refreshSessionAndData(actor);
    } catch (e) {
      toast.error(`Suggestion failed: ${e}`);
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
const handleVoteCourse = async (courseId) => {
  const course = (allCourses || []).find((c) => c.id === courseId);
  if (course?.hasVoted) {
    toast.error("You have already voted for this course.");
    return;
  }
  setVotingInProgress(true);
  try {
        const res = await actor.vote_for_course(courseId);
    // If Candid Result variant
    if (res && res.Err) {
      toast.error(`Vote failed: ${res.Err}`);
      return;
    }   
    toast.success("Voted successfully!");
    setAllCourses((prev=[]) =>
      prev.map(c =>
        c.id === courseId
          ? { ...c, vote_count: Number(c.vote_count || 0) + 1, hasVoted: true }//{ ...c, vote_count: c.vote_count + 1, hasVoted: true }
          : c
      )
    );
    await refreshSessionAndData(actor);
  } catch (e) {
    toast.error(`Vote failed: ${e}`);
  } finally {
    setVotingInProgress(false);
  }
};
const handleSuggestedVoteCourse = async (courseId) => {
  const course = allCourses.find((c) => c.id === courseId);
  if (course?.hasVoted) {
    toast.error("You have already voted for this course.");
    return;
  }
  setVotingInProgress(true);
  try {
    
     const res = await actor.vote_for_course(courseId);
   
    if (res && res.Err) {
      toast.error(`Vote failed: ${res.Err}`);
      return;
    }    
    toast.success("Voted successfully!");
    setAllCourses((prev=[]) =>
      prev.map(c =>
        c.id === courseId
          ? { ...c, vote_count: Number(c.vote_count || 0) + 1, hasVoted: true }//{ ...c, vote_count: c.vote_count + 1, hasVoted: true }
          : c
      )
    );
    console.log(c.title, c.status, c.hasVoted);
  } catch (e) {
    toast.error(`Vote failed: ${e}`);
  } finally {
    setVotingInProgress(false);
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


// const handleImageChange = (base64, mime) => {
//   // Optional: upload to backend or just store locally
//   console.log("Base64:", base64);
//   console.log("MIME type:", mime);
//   setAvatarPreview(`data:${mime};base64,${base64}`);
// };
// const handleImageChange = (base64, mime) => {
//   console.log("Base64:", base64);
//   console.log("MIME type:", mime);
//   setAvatarPreview(`data:${mime};base64,${base64}`);
//   const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
//   // Call backend to upload
//   backend.upload_my_profile_image(byteArray, mime)
//     .then(() => console.log("Image uploaded successfully"))
//     .catch(err => console.error("Upload failed:", err));
// };
const handleImageChange = async (base64, mime) => {

  console.log("inside handleImageChange the value of MIME:", mime);
  console.log("inside handleImageChange Base64 length:", base64.length);

  try {
    // ✅ Validate MIME type
    if (!mime.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    // ✅ Convert base64 to byte array
    const byteArray = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    // ✅ Optional: Limit file size (e.g., 500KB)
    if (byteArray.length > 500000) {
      toast.error("Image too large. Please upload a smaller file.");
      return;
    }
    // ✅ Set preview for UI
    setAvatarPreview(`data:${mime};base64,${base64}`);
    // ✅ Upload to backend canister
   // await backend.upload_my_profile_image(byteArray, mime);
    setAvatarBytes(byteArray);
    setAvatarMime(mime);

    toast.success("Profile image uploaded successfully");
  } catch (err) {
    console.error("Upload failed:", err);
    toast.error("Failed to upload image");
  }
};
//const [preview, setPreview] = useState(avatarPreview || null);
// const handleFileChange = async (e) => {
//   const file = e.target.files?.[0];
//   if (!file) return;
//   const reader = new FileReader();
//   reader.onload = () => {
//     const result = reader.result;
//     setPreview(result); // full data URL
//     const base64 = result.split(",")[1];
//     handleImageChange(base64, file.type); // ✅ use defined function
//   };
//   reader.readAsDataURL(file);
// };
// const handleFileChange = async (e) => {
//   const file = e.target.files?.[0];
//   if (!file) return;
//   if (!file.type.startsWith("image/")) {
//     toast.error("Only image files are allowed");
//     return;
//   }
//   if (file.size > 500000) {
//     toast.error("Image too large. Please upload a smaller file.");
//     return;
//   }
//   const reader = new FileReader();
//   reader.onload = () => {
//     const result = reader.result; // full data URL
//     setPreview(result);           // local preview
//     const base64 = result.split(",")[1]; // extract base64
//     handleImageChange(base64, file.type, result); // ✅ pass preview URL to parent
//   };
//   reader.readAsDataURL(file);
// };
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
          myCourses={allCourses||[].filter((c)=> c.professor_id === principalText)}          
          currentProfile={myProfile}
          onUpdateProfile={handleCreateOrUpdateProfile}
          // onImageChange={handleImageChange}
          // avatarPreview={avatarPreview}
            avatarPreview={avatarPreview}
            onImageChange={handleImageChange}
          onCreateCourse={handleCreateCourse}
          onProposeCourse={handleProposeCourse}
        />
      )}

      {role === "Student" && (
        <StudentPanel
          principalText={principalText}
          currentProfile={myProfile}
          onUpdateProfile={handleCreateOrUpdateProfile}
           onSuggestionCourse={handleSuggestionCourse}
          // onSuggestedCourse={allCourses.filter((c) => c.status === "Suggest")}
          suggestedCourses={(allCourses || []).filter((c) => c.status === "Suggest")}
          coursesForVoting={(allCourses||[]).filter((c) => c.status === "Proposed" || c.status === "Voting")}
          approvedCourses={(allCourses||[]).filter((c) => c.status === "Approved")}
          myEnrolledCourses={myEnrolledCourses}
          votingInProgress={votingInProgress}
          onVoteSuggestedCourse={handleSuggestedVoteCourse}
          onVoteCourse={handleVoteCourse}
          onEnrollCourse={handleEnrollCourse}
          avatarPreview={avatarPreview}
            onImageChange={handleImageChange}
        />
      )}
    </div>
  );
}


