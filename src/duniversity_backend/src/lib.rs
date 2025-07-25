use ic_cdk::{init, caller};

use std::cell::RefCell;
use std::collections::HashMap;
use candid::{CandidType, Deserialize, Principal};
 //use ic_cdk::query;
// --- Custom Type Aliases for Clarity ---
type CourseId = String; // Using String for simplicity, can be u64 or Principal later
type UserId = Principal; // Clarity for users

// --- ENUMS ---
#[derive(Clone, Debug, CandidType, Deserialize, PartialEq, Eq)]
pub enum Role {
    Admin,
    Student,
    Developer,
    Professor,
    Guest, // Default role for new users
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq, Eq)]
pub enum CourseStatus {
    Draft,    // Created by Professor, not yet proposed
    Proposed, // Proposed by Professor, awaiting student votes
    Voting,   // Actively in voting phase (could be a sub-status of Proposed)
    Approved, // Approved by Admin, open for enrollment
    Rejected, // Rejected by Admin or failed voting
    Archived, // Old courses
}

// --- STRUCTS ---

// Represents a user's profile information
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct UserProfile {
  pub profile_id: Principal,
  pub name: String,
  pub bio: Option<String>,
  pub contact_email: Option<String>,
  pub github_username: Option<String>,
}

// Represents a course in the university
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Course {
    pub id: CourseId,
    pub title: String,
    pub description: String,
    pub professor_id: UserId, // Principal of the professor who created it
    pub status: CourseStatus,
    pub created_at: u64,
    pub vote_count: u64, // Number of student votes (for future voting feature)
    pub voters: HashMap<UserId, bool>, // Tracks which students have voted (for future voting feature)
    pub enrolled_students: HashMap<UserId, bool>, // Tracks enrolled students (for future enrollment)
}

// --- THREAD-LOCAL STORAGE ---
// This is where our DApp's state lives.
thread_local! {
    // Stores user roles (Principal -> Role)
    static USER_ROLES: RefCell<HashMap<Principal, Role>> = RefCell::new(HashMap::new());
    // Stores deployer principal (set once at init)
    static DEPLOYER_PRINCIPAL: RefCell<Option<Principal>> = RefCell::new(None);
    // Stores user profiles (Principal -> UserProfile)
     static USER_PROFILES: std::cell::RefCell<std::collections::HashMap<Principal, UserProfile>> = RefCell::new(HashMap::new());
    //static USER_PROFILES: RefCell<HashMap<String, UserProfile>> = RefCell::new(HashMap::new());
    // static PROFILES: RefCell<HashMap<String, Profile>> = RefCell::new(HashMap::new());
    // Stores all courses (CourseId -> Course)
    static COURSES: RefCell<HashMap<CourseId, Course>> = RefCell::new(HashMap::new());
    // Stores student enrollments (StudentId -> Vec<CourseId>) - for future use
    static STUDENT_ENROLLMENTS: RefCell<HashMap<UserId, Vec<CourseId>>> = RefCell::new(HashMap::new());
}

// --- HELPER FUNCTIONS (Permission Checks) ---

fn is_admin(p: Principal) -> bool {
    USER_ROLES.with(|m| matches!(m.borrow().get(&p), Some(Role::Admin)))
}

fn is_professor(p: Principal) -> bool {
    USER_ROLES.with(|m| matches!(m.borrow().get(&p), Some(Role::Professor)))
}

fn is_student(p: Principal) -> bool {
    USER_ROLES.with(|m| matches!(m.borrow().get(&p), Some(Role::Student)))
}

fn require_admin() {
    let me = caller();
    assert!(me != Principal::anonymous(), "Authentication required: Caller is anonymous.");
    assert!(is_admin(me), "Authorization failed: Only admins can call this method.");
    ic_cdk::println!("Admin {:?} successfully called an admin-only method.", me);
}
fn require_developer_or_admin() {
    let me = caller();
    assert!(me != Principal::anonymous(), "Authentication required: Caller is anonymous.");
    assert!(is_admin(me), "Authorization failed: Only admins can call this method.");
    ic_cdk::println!("Admin {:?} successfully called an admin-only method.", me);
}
fn require_professor() {
    let me = caller();
    assert!(me != Principal::anonymous(), "Authentication required: Caller is anonymous.");
    assert!(is_professor(me), "Authorization failed: Only professors can call this method.");
    ic_cdk::println!("Professor {:?} successfully called a professor-only method.", me);
}

fn require_student() {
    let me = caller();
    assert!(me != Principal::anonymous(), "Authentication required: Caller is anonymous.");
    assert!(is_student(me), "Authorization failed: Only students can call this method.");
    ic_cdk::println!("Student {:?} successfully called a student-only method.", me);
}
#[ic_cdk::query]
fn require_registered_user() {
    let me = caller();
    assert!(me != Principal::anonymous(), "Authentication required: Caller is anonymous.");
    assert!(
        USER_ROLES.with(|m| m.borrow().contains_key(&me)),
        "Authorization failed: Only registered users can call this method."
    );
}

// --- INITIALIZER ---
#[init]
fn init() {
    let deployer = caller();
    USER_ROLES.with(|m| {
        m.borrow_mut().insert(deployer, Role::Developer);
    });
    DEPLOYER_PRINCIPAL.with(|p| {
        *p.borrow_mut() = Some(deployer);
    });
    ic_cdk::println!("Canister initialized. Deployer {:?} set as Developer.", deployer);
}

// ──────────────────────────────────────────────────────────────
// AUTHENTICATION & ROLE MANAGEMENT FUNCTIONS
// ──────────────────────────────────────────────────────────────

#[ic_cdk::update]
fn login_as_role(requested_role: Role) -> Role {
    let me = caller();
    assert!(me != Principal::anonymous(), "Cannot login with an anonymous principal.");

    USER_ROLES.with(|m| {
        let mut user_map = m.borrow_mut();
        if let Some(existing_role) = user_map.get(&me) {
            ic_cdk::println!("User {:?} logged in. Existing role: {:?}. Requested role: {:?}", me, existing_role, requested_role);
            existing_role.clone()
        } else {
            let assigned_role = match requested_role {
                Role::Admin => {
                    // If any Admin already exists (e.g., the deployer),
                    // new users requesting Admin become Guest by default.
                    if user_map.values().any(|r| matches!(r, Role::Admin)) {
                        ic_cdk::println!("New user {:?} requested Admin, but an Admin already exists. Assigning Guest.", me);
                        Role::Guest
                    } else {
                        // This case should ideally only be hit if init() somehow failed
                        // or data was wiped uniquely. It's a fallback to allow an admin if absolutely none exist.
                        ic_cdk::println!("New user {:?} requested Admin, and no Admin currently exists. Assigning Admin.", me);
                        Role::Admin
                    }
                },
                _ => { // Requested role is Student, Professor, or Guest. Assign it.
                    ic_cdk::println!("New user {:?} logging in, assigning requested role: {:?}", me, requested_role);
                    requested_role
                }
            };
            user_map.insert(me, assigned_role.clone());
            assigned_role
        }
    })
}

#[ic_cdk::update]
fn assign_role(user: Principal, role: Role) {
   // require_admin(); // Only admin can assign roles
   require_developer_or_admin();
    USER_ROLES.with(|m| {
        m.borrow_mut().insert(user, role.clone());
    });
    ic_cdk::println!("Admin {:?} assigned role {:?} to user {:?}.", caller(), role, user);
}

#[ic_cdk::query]
fn my_role() -> Role {
    let me = caller();
    USER_ROLES.with(|m| m.borrow().get(&me).cloned().unwrap_or(Role::Guest))
}

#[ic_cdk::query]
fn list_users() -> Vec<(Principal, Role)> {
    require_admin();
    USER_ROLES.with(|m| {
        m.borrow()
            .iter()
            .map(|(p, r)| (*p, r.clone()))
            .collect()
    })
}

#[ic_cdk::query]
fn list_principals() -> Vec<Principal> {
    USER_ROLES.with(|m| m.borrow().keys().cloned().collect())
}

#[ic_cdk::query]
fn get_deployer_principal() -> Option<Principal> {
    DEPLOYER_PRINCIPAL.with(|p| p.borrow().clone())
}

#[ic_cdk::query]
fn whoami() -> Principal {
    caller()
}

// ──────────────────────────────────────────────────────────────
// PROFILE MANAGEMENT FUNCTIONS
// ──────────────────────────────────────────────────────────────

/// Allows a logged-in user to create or update their profile.
#[ic_cdk::update]
fn create_or_update_my_profile(profile_data: UserProfile) {
  require_registered_user();
    let caller_principal= caller();

  ic_cdk::println!(
    "Saving profile for {:?} (sent profile_id={:?})",
    caller_principal, profile_data.profile_id
  );

  USER_PROFILES.with(|map| {
    map.borrow_mut().insert(
      caller_principal,
      UserProfile {
        profile_id: caller_principal,
        name: profile_data.name,
        bio: profile_data.bio,
        contact_email: profile_data.contact_email,
        github_username: profile_data.github_username,
      },
    );
  });
}


// fn update_profile(profile: Profile) {
//   PROFILES.with(|p| {
//     p.borrow_mut().insert(profile.principal.clone(), profile);
//   });
// }
// #[query]
// fn get_profile(principal: String) -> Option<Profile> {
//   PROFILES.with(|p| p.borrow().get(&principal).cloned())
// }
// /// Retrieves the profile of the current caller.

/// Admin-only: Retrieves any user's profile by their Principal ID.
// #[ic_cdk::query]
// fn get_user_profile(user_id: Principal) -> Option<UserProfile> {
//     require_admin();
//     USER_PROFILES.with(|p| p.borrow().get(&user_id).cloned())
// }
#[ic_cdk::query]
fn get_my_profile() -> Option<UserProfile> {
  require_registered_user();
  let caller_principal = ic_cdk::caller();
  USER_PROFILES.with(|map| map.borrow().get(&caller_principal).cloned())
}
// ──────────────────────────────────────────────────────────────
// COURSE MANAGEMENT FUNCTIONS
// ──────────────────────────────────────────────────────────────

/// Professor-only: Creates a new course in Draft status.
#[ic_cdk::update]
fn create_course(title: String, description: String) -> Result<Course, String> {
    require_professor(); // Only professors can create courses
    let professor_id = caller();
    let course_id = format!("course-{}", ic_cdk::api::time()); // Simple unique ID
    let created_at = ic_cdk::api::time();

    let new_course = Course {
        id: course_id.clone(),
        title,
        description,
        professor_id,
        status: CourseStatus::Draft,
        created_at,
        vote_count: 0,
        voters: HashMap::new(),
        enrolled_students: HashMap::new(),
    };

    COURSES.with(|c| {
        let mut courses_map = c.borrow_mut();
        if courses_map.contains_key(&course_id) {
            Err("Course ID collision, please try again.".to_string())
        } else {
            courses_map.insert(course_id.clone(), new_course.clone());
            ic_cdk::println!("Professor {:?} created new course: {:?}", professor_id, new_course);
            Ok(new_course)
        }
    })
}

/// Professor-only: Proposes a course from Draft to Proposed.
#[ic_cdk::update]
fn propose_course(course_id: CourseId) -> Result<Course, String> {
    require_professor();
    let professor_id = caller();

    COURSES.with(|c| {
        let mut courses_map = c.borrow_mut();
        if let Some(course) = courses_map.get_mut(&course_id) {
            // Check if this professor created the course
            if course.professor_id != professor_id {
                return Err("Only the professor who created this course can propose it.".to_string());
            }
            // Check if it's in Draft status
            if course.status != CourseStatus::Draft {
                return Err(format!("Course is not in Draft status. Current status: {:?}", course.status));
            }
            course.status = CourseStatus::Proposed;
            ic_cdk::println!("Professor {:?} proposed course: {:?}", professor_id, course_id);
            Ok(course.clone())
        } else {
            Err("Course not found.".to_string())
        }
    })
}

/// Student-only: Votes for a proposed course.
#[ic_cdk::update]
fn vote_for_course(course_id: CourseId) -> Result<Course, String> {
    require_student();
    let student_id = caller();
    COURSES.with(|c| {
        let mut courses_map = c.borrow_mut();
        if let Some(course) = courses_map.get_mut(&course_id) {
            // Check if the course is in Proposed or Voting status
            if course.status != CourseStatus::Proposed && course.status != CourseStatus::Voting {
                return Err(format!("Course is not open for voting. Current status: {:?}", course.status));
            }
            // Check if student has already voted
            if course.voters.contains_key(&student_id) {
                return Err("You have already voted for this course.".to_string());
            }
            //ic_cdk::println!("course.vote_count", course.vote_count);
            course.vote_count += 1;
            course.voters.insert(student_id, true);
            // Optionally, change status to Voting if it's currently Proposed and gets its first vote
            if course.status == CourseStatus::Proposed {
                course.status = CourseStatus::Voting;
            }
            ic_cdk::println!("Student {:?} voted for course: {:?}", student_id, course_id);
            ic_cdk::println!("Student {:?} voted for course {} (total now {})", student_id, course_id, course.vote_count);

            Ok(course.clone())
        } else {
            Err("Course not found.".to_string())
        }
    })
}
fn get_course_voters(course_id: CourseId) -> Vec<Principal> {
  COURSES.with(|c| {
    c.borrow()
     .get(&course_id)
     .map(|course| course.voters.keys().cloned().collect())
     .unwrap_or_default()
  })
}

/// Admin-only: Approves a course.
#[ic_cdk::update]
fn approve_course(course_id: CourseId) -> Result<Course, String> {
    require_admin();
    COURSES.with(|c| {
        let mut courses_map = c.borrow_mut();
        if let Some(course) = courses_map.get_mut(&course_id) {
            // Can only approve courses that are Proposed or Voting
            if course.status != CourseStatus::Proposed && course.status != CourseStatus::Voting {
                return Err(format!("Course cannot be approved from current status: {:?}", course.status));
            }
            course.status = CourseStatus::Approved;
            ic_cdk::println!("Admin {:?} approved course: {:?}", caller(), course_id);
            Ok(course.clone())
        } else {
            Err("Course not found.".to_string())
        }
    })
}

/// Admin-only: Rejects a course.
#[ic_cdk::update]
fn reject_course(course_id: CourseId) -> Result<Course, String> {
    require_admin();
    COURSES.with(|c| {
        let mut courses_map = c.borrow_mut();
        if let Some(course) = courses_map.get_mut(&course_id) {
            // Can reject from Draft, Proposed, or Voting states
            if course.status == CourseStatus::Approved {
                return Err("Approved courses cannot be directly rejected. Consider archiving.".to_string());
            }
            course.status = CourseStatus::Rejected;
            ic_cdk::println!("Admin {:?} rejected course: {:?}", caller(), course_id);
            Ok(course.clone())
        } else {
            Err("Course not found.".to_string())
        }
    })
}

/// Student-only: Enrolls in an approved course.
#[ic_cdk::update]
fn enroll_in_course(course_id: CourseId) -> Result<Course, String> {
    require_student();
    let student_id = caller();

    COURSES.with(|c| {
        let mut courses_map = c.borrow_mut();
        if let Some(course) = courses_map.get_mut(&course_id) {
            if course.status != CourseStatus::Approved {
                return Err("Course is not approved for enrollment.".to_string());
            }
            if course.enrolled_students.contains_key(&student_id) {
                return Err("You are already enrolled in this course.".to_string());
            }

            course.enrolled_students.insert(student_id, true);
            
            // Also update student's own enrollment list
            STUDENT_ENROLLMENTS.with(|e| {
                e.borrow_mut()
                    .entry(student_id)
                    .or_default() // Get or create Vec<CourseId> for this student
                    .push(course_id.clone());
            });

            ic_cdk::println!("Student {:?} enrolled in course: {:?}", student_id, course_id);
            Ok(course.clone())
        } else {
            Err("Course not found.".to_string())
        }
    })
}

/// Student-only: Lists courses the student is enrolled in.
#[ic_cdk::query]
fn get_my_enrolled_courses() -> Vec<Course> {
    require_student();
    let student_id = caller();
    
    STUDENT_ENROLLMENTS.with(|e| {
        let enrolled_course_ids = e.borrow().get(&student_id).cloned().unwrap_or_default();
        COURSES.with(|c| {
            let courses_map = c.borrow();
            enrolled_course_ids.into_iter()
                .filter_map(|id| courses_map.get(&id).cloned())
                .collect()
        })
    })
}


/// Public: Get details of a specific course.
#[ic_cdk::query]
fn get_course_details(course_id: CourseId) -> Option<Course> {
    COURSES.with(|c| c.borrow().get(&course_id).cloned())
}

/// Public: List courses by status. Can be called by anyone.
/// Admins can see all statuses. Professors see their own Drafts/Proposed. Students see Proposed/Approved.
#[ic_cdk::query]
fn list_courses(filter_status: Option<CourseStatus>) -> Vec<Course> {
    let me = caller();

    let is_admin = is_admin(me);
    let is_professor = is_professor(me);
    let is_student = is_student(me);

    ic_cdk::println!("CALLER is: {:?}", me);
    ic_cdk::println!("is_professor: {}", is_professor);
    ic_cdk::println!("COURSES total stored: {}", COURSES.with(|c| c.borrow().len()));
    COURSES.with(|c| {
        c.borrow()
            .iter()
            .filter(|(_id, course)| {
                // Apply optional status filter
                if let Some(status) = filter_status.clone() {
                    if course.status != status {
                        return false;
                    }
                }

                // Apply role-based visibility
                match course.status {
                    CourseStatus::Draft => is_admin || (is_professor && course.professor_id == me),
                    CourseStatus::Proposed => is_admin || is_student || (is_professor && course.professor_id == me),
                    CourseStatus::Voting => is_admin || is_student || (is_professor && course.professor_id == me),
                    CourseStatus::Approved => is_admin || is_student || is_professor, // Everyone can see approved courses
                    CourseStatus::Rejected | CourseStatus::Archived => is_admin || (is_professor && course.professor_id == me), // Only admin/creator sees rejected/archived
                }
            })
            .map(|(_id, course)| course.clone())
            .collect()
    })
}

// Export Candid interface for the canister.
ic_cdk::export_candid!();