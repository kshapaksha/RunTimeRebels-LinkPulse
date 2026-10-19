
function getOwner() {
  let owner = localStorage.getItem("lp_owner");

  if (owner === null) {

    owner = crypto.randomUUID();
    localStorage.setItem("lp_owner", owner);
  }

  return owner;
}