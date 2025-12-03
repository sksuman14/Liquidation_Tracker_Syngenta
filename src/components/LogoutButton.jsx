export default function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "8px 15px",
        background: "red",
        color: "white",
        borderRadius: "5px",
        border: "none",
        cursor: "pointer",
        position: "absolute",
        top: "10px",
        right: "10px"
      }}
    >
      Logout
    </button>
  );
}
