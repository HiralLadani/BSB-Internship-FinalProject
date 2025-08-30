// lib.rs



mod roles;
mod profiles;
mod courses;
use crate::roles::Role;
use crate::profiles::UserProfile;
use crate::courses::{Course, CourseStatus};
use candid::Principal;
use ic_cdk_macros::{init, query, update};
use ic_stable_memory::stable_memory_init;
use crate::roles::{is_admin, is_professor, is_student,is_developer};
use ic_cdk::caller;



#[init]
fn init() {
    stable_memory_init(); // Initialize stable memory allocator :contentReference[oaicite:0]{index=0}

    let deployer = ic_cdk::caller();
    roles::init_if_needed(deployer);
    profiles::init_if_needed(deployer);
    courses::init_if_needed(deployer);

    ic_cdk::println!("Canister initialized. Deployer {:?} registered.", deployer);
}
fn require_admin() {
    let me = caller();
    assert!(is_admin(me), "Authorization failed: only admins");
}

fn require_professor() {
    let me = caller();
    assert!(is_professor(me), "Authorization failed: only professors");
}

fn require_student() {
    let me = caller();
    assert!(is_student(me), ".Authorization failed: only students");
}
#[query]
fn whoami() -> Principal {
    ic_cdk::caller()
}

#[query]
fn get_deployer_principal() -> Option<Principal> {
    roles::list_principals().first().cloned()
}

#[update]
fn login_as_role(requested_role: Role) -> Role {
    let me = ic_cdk::caller();
    roles::login_as_role(me, requested_role)
}
#[query]
fn my_role() -> Role {
    let me = ic_cdk::caller();
    roles::my_role(me)
}
#[update]
fn create_or_update_my_profile(profile: UserProfile) {
      let me = caller();
      ic_cdk::println!("Storing for: {:?}", ic_cdk::caller());
    profiles::create_or_update_my_profile(me, profile);
}

#[query]
fn get_my_profile() -> Option<UserProfile> {
      let me = caller();
    profiles::get_my_profile(me)
}

#[query]
fn  get_profile_image_info() -> Option<(usize, String)> {
    let me = caller();
    profiles::get_profile_image_info(me)
}
#[query]
fn has_profile_image() -> bool {
    let me = caller();
    profiles::has_profile_image(me)
}
#[query]
fn list_user_profiles() -> Vec<(Principal, UserProfile)> {
    profiles::list_user_profiles()
}
#[query]
fn list_users() -> Vec<(Principal, Role)> {
    //require_admin();
    roles::list_users()
}
#[update]
fn assign_admin(user: Principal) {
    let me = caller();
    assert!(is_admin(me) || is_developer(me), "Only admins or developers can assign admin.");
    roles::assign_admin(user);
}
#[update]
fn assign_role(user: Principal, role: Role) {
    require_admin();
    roles::assign_role(user, role);
}
#[update]
fn create_course(title: String, description: String) -> Result<Course, String> {
    require_professor();
    let me = ic_cdk::caller();
    let course = Course {
        id: format!("course-{}", ic_cdk::api::time()),
        title,
        description,
        professor_id: me,
        status: CourseStatus::Draft,
        created_at: ic_cdk::api::time(),
        vote_count: 0,
        voters: std::collections::HashMap::new(),
        enrolled_students: std::collections::HashMap::new(),
    };
    courses::create_course(course.id.clone(), course.clone())?;
    Ok(course)
}
#[update]
fn suggest_course(title: String, description: String) -> Result<Course, String> {
   require_student();
    let me = ic_cdk::caller();
    let course = Course {
        id: format!("course-{}", ic_cdk::api::time()),
        title,
        description,
        professor_id: me,
        status: CourseStatus::Suggest,
        created_at: ic_cdk::api::time(),
        vote_count: 0,
        voters: std::collections::HashMap::new(),
        enrolled_students: std::collections::HashMap::new(),
    };
    courses::suggest_course(course.id.clone(), course.clone())?;
    Ok(course)
}
#[update]
fn propose_course(course_id: String) -> Result<Course, String> {
    require_professor();
    courses::propose_course(course_id, ic_cdk::caller())
}

#[update]
fn vote_for_course(course_id: String) -> Result<Course, String> {
    require_student();
    courses::vote_for_course(course_id, ic_cdk::caller())
}

#[update]
fn vote_for_suggest_course(course_id: String) -> Result<Course, String> {
    require_student();
    courses::vote_for_suggest_course(course_id, ic_cdk::caller())
}
#[update]
fn approve_course(course_id: String) -> Result<Course, String> {
    require_admin();
    courses::approve_course(course_id)
}

#[update]
fn reject_course(course_id: String) -> Result<Course, String> {
    require_admin();
    courses::reject_course(course_id)
}

#[update]
fn enroll_in_course(course_id: String) -> Result<Course, String> {
    require_student();
    courses::enroll_in_course(course_id, ic_cdk::caller())
}

#[query]
fn get_my_enrolled_courses() -> Vec<Course> {
    // If tracking enrollments separately using stable memory is desired,
    // integrate that here; or fetch courses directly.
    let me = ic_cdk::caller();
    courses::get_my_enrolled_courses(me)
}

#[query]
fn get_course_details(course_id: String) -> Option<Course> {
    courses::get_course_details(course_id)
}

#[query]
fn list_courses(filter_status: Option<CourseStatus>) -> Vec<Course> {
    courses::list_courses(filter_status)
}
// #[update]
// fn upload_my_profile_image(image: Vec<u8>, mime: String) {
//     profiles::upload_my_profile_image(image, mime);
// }

// #[query]
// fn get_my_profile_image() -> Option<(Vec<u8>, String)> {
//     //let me = ic_cdk::caller();
//     profiles::get_my_profile_image()
// }
// #[query]
// fn get_profile_image(profile_id: Principal) -> Option<(Vec<u8>, String)> {
//    profiles::get_profile_image(profile_id)
// }
// Export Candid interface with all public-facing functions
ic_cdk::export_candid!();
