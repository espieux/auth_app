import Principal "mo:base/Principal";
actor {
  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };

  public shared query (msg) func whoami() : async Principal {
    msg.caller;
  };
};
