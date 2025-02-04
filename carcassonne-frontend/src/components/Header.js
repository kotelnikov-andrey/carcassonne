import { Link } from "react-router-dom";

function Header() {
  return (
    <header
      style={{
        backgroundColor: "#f5f5f5",
        padding: "10px",
        textAlign: "center",
      }}
    >
      <h1>
        <Link to="/" style={{ textDecoration: "none", color: "#333" }}>
          Carcassonne
        </Link>
      </h1>
    </header>
  );
}

export default Header;
