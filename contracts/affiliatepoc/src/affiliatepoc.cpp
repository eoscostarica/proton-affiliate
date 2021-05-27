#include <affiliatepoc.hpp>

ACTION add_user(name account, uint8_t user_role) {
  // user must be admin or smart contract account to register users
  require_auth(get_self());

  // Init the users table
  referral_users_table _referral_users(get_self(), get_self().value);

  // Find the record from _referrals table
  auto referral_user_itr = _referral_users.find(account.value);
  if (referral_user_itr == _referral_users.end()) {
    // Create a referral user record if it does not exist
    _referral_users.emplace(from, [&](auto& referral_user) {
      referral_user.account = account;
      referral_user.user_role = user_role;
    });
  } else {
    // Modify a referral user record if it exists
    _referral_users.modify(referral_user_itr, account, [&](auto& referral_user) {
      referral_user.user_role = user_role;
    });
  }
}

ACTION create_referral(name invitee, name referrer) {
  // check user is authorized as referrer

  // check invitee is not a registered account

  // calculate expires_on date

  // set status to PENDING_USER_REGISTRATION

  // register invitee account name
}

ACTION expire_referral(name ivitee) {
  // check if expires_on is >= .now()  

  // set referal status to EXPIRED 

  // delete record to save RAM
}

ACTION verify_referral(name invitee) {
  // check if invitee is in acc column in eosio.proton:usersinfo table

  // if no record is found status remains PENDING_USER_REGISTRATION

  // if verified == 0  set status PENDING_KYC_VERIFICATION 

  // if verified == 1  set status PENDING_PAYMENT
}

ACTION pay_referral(name invitee) {
  // transfer REFERRAL_AMOUNT to invitee and referrer

  // set referal status to  PAID

  // delete record to save RAM
}

ACTION reject_payment(name invitee) {
  // Check user is admin 

  // set referal status to PAYMENT_REJECTED

  // delete record to save RAM
}

ACTION set_params(symbol token, name reward_account, uint8_t reward_amount, uint64_t expiry_period, bool manual_review) { 
// check user is admin 

// update params table
}

ACTION affiliatepoc::clear() {
  require_auth(get_self());

  referrals_table _referrals(get_self(), get_self().value);

  // Delete all records in _referrals table
  auto referal_itr = _referrals.begin();
  while (referal_itr != _referrals.end()) {
    referal_itr = _referrals.erase(referal_itr);
  }
}

EOSIO_DISPATCH(affiliatepoc, (add_user)(create_referral)(expire_referral)(verify_referral)(pay_referral)(reject_payment)(set_params)(clear))
