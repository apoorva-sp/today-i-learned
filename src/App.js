import { useEffect, useRef, useState } from "react";
import supabase from "./supabase";
import Cookies from "js-cookie";

const CATEGORIES = [
  { name: "technology", color: "#3b82f6" },
  { name: "science", color: "#16a34a" },
  { name: "finance", color: "#ef4444" },
  { name: "society", color: "#eab308" },
  { name: "entertainment", color: "#db2777" },
  { name: "health", color: "#14b8a6" },
  { name: "history", color: "#f97316" },
  { name: "news", color: "#8b5cf6" },
];
function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}
function App() {
  const [showForm, setShowForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [facts, setFacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("all");
  const username = Cookies.get("username");

  useEffect(
    function () {
      async function getFacts() {
        setIsLoading(true);

        let query = supabase.from("facts").select("*");

        if (currentCategory !== "all") {
          query = query.eq("category", currentCategory);
        }

        const { data: facts, error } = await query
          .order("votesInteresting", { ascending: false })
          .limit(1000);

        if (!error) setFacts(facts);
        else alert("There was a problem in fetching the facts");

        setIsLoading(false);
      }
      getFacts();
    },
    [currentCategory]
  );
  return (
    <>
      <Header
        setShowForm={setShowForm}
        showForm={showForm}
        setShowLoginForm={setShowLoginForm}
        username={username}
      />

      {showForm ? (
        <NewFactForm setFacts={setFacts} setShowForm={setShowForm} />
      ) : null}

      {showLoginForm ? (
        <div className="login-container">
          <LoginForm setShowLoginForm={setShowLoginForm} />
        </div>
      ) : null}

      <main className="main">
        <CategoryFilter setCurrentCategory={setCurrentCategory} />
        {isLoading ? (
          <Loader />
        ) : (
          <FactList
            facts={facts}
            setFacts={setFacts}
            username={username}
            setShowLoginForm={setShowLoginForm}
          />
        )}
      </main>
    </>
  );
}
function Loader() {
  return <p className="message">Loading...</p>;
}
function Header({ setShowForm, showForm, setShowLoginForm, username }) {
  function validate() {
    if (username) {
      setShowForm(!showForm);
    } else {
      setShowLoginForm(true);
    }
  }
  return (
    <header className="header">
      <div className="logo">
        <img src="logo.png" height="68" width="68" alt="Today I Learned Logo" />
        <h1>Today I Learned</h1>
      </div>

      <button className="btn btn-large btn-open" onClick={() => validate()}>
        {showForm ? "Close" : "Share a fact"}
      </button>
    </header>
  );
}
function NewFactForm({ setFacts, setShowForm }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [isUpLoading, setIsUpLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    console.log(text, category, source);

    if (text) {
      console.log("there is a text");
    }

    if (text && category && isValidHttpUrl(source) && text.length <= 200) {
      setIsUpLoading(true);
      const { data: newFact, error } = await supabase
        .from("facts")
        .insert([{ text, category, source }])
        .select("*");
      setIsUpLoading(false);

      if (!error) {
        const user_id = Cookies.get("user_id");
        const { data, error } = await supabase
          .from("posts")
          .insert([{ user_id, post_id: newFact[0].id }]);

        if (error) {
          alert("There was a problem in creating the post");
        } else {
          setFacts((facts) => [...facts, ...newFact]);
        }
      }
      setText("");
      setCategory("");
      setSource("");
      setShowForm(false);
    }
  }
  return (
    <form className="fact-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Share a fact with the world..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isUpLoading}
      />
      <span>{200 - text.length}</span>
      <input
        type="text"
        placeholder="Trustworthy source..."
        value={source}
        onChange={(e) => setSource(e.target.value)}
        disabled={isUpLoading}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isUpLoading}
      >
        <option value="">Choose category:</option>
        {CATEGORIES.map((category) => (
          <option key={category.name} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-large">
        Post
      </button>
    </form>
  );
}
function CategoryFilter({ setCurrentCategory }) {
  return (
    <aside>
      <ul>
        <li className="category">
          <button
            className="btn btn-all-categories"
            onClick={() => setCurrentCategory("all")}
          >
            All
          </button>
        </li>
        {CATEGORIES.map((category) => (
          <li key={category.name} className="category">
            <button
              className="btn btn-category"
              style={{ backgroundColor: category.color }}
              onClick={() => setCurrentCategory(category.name)}
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FactList({ facts, setFacts, username, setShowLoginForm }) {
  if (facts.length === 0) {
    return (
      <p className="message">
        No facts for this category yet! Create the first one
      </p>
    );
  }
  return (
    <section>
      <ul className="facts-list">
        {facts.map((fact) => (
          <Fact
            key={fact.id}
            fact={fact}
            setFacts={setFacts}
            username={username}
            setShowLoginForm={setShowLoginForm}
          />
        ))}
      </ul>
      <p>There are {facts.length} facts</p>
    </section>
  );
}
function Fact({ fact, setFacts, username, setShowLoginForm }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isDisputed =
    fact.votesFalse > fact.votesInteresting + fact.votesMindblowing;
  async function validate(voteType) {
    if (username) {
      const user_id = Cookies.get("user_id");

      const { data: userVote, error } = await supabase
        .from("interaction")
        .select("*")
        .eq("user_id", user_id)
        .eq("post_id", fact.id);

      if (!error) {
        if (userVote.length > 0) {
          alert("You have already voted for this fact");
          return;
        } else {
          handleVote(voteType);
          const { data: newVote, error: insertError } = await supabase
            .from("interaction")
            .insert([{ user_id, post_id: fact.id }])
            .select();
          if (insertError) {
            console.error("Error inserting vote:", insertError);
            alert("There was a problem in voting for the fact");
          }
        }
      } else {
        alert("Error voting for fact");
      }
    } else {
      setShowLoginForm(true);
    }
  }

  async function handleVote(voteType) {
    setIsUpdating(true);
    const { data: updatedFact, error } = await supabase
      .from("facts")
      .update({
        [voteType]: fact[voteType] + 1,
      })
      .eq("id", fact.id)
      .select();
    setIsUpdating(false);
    if (!error) {
      // Update the local state with the new votes
      setFacts((facts) =>
        facts.map((f) => (f.id === fact.id ? updatedFact[0] : f))
      );
    }
  }
  return (
    <li className="fact">
      <p>
        {isDisputed ? <span className="disputed">[🚨DISPUTED]</span> : null}
        {fact.text}
        <a
          className="source"
          href={fact.source}
          target="_blank"
          rel="noreferrer"
        >
          (Source)
        </a>
      </p>
      <span
        className="tag"
        style={{
          backgroundColor: CATEGORIES.find((cat) => cat.name === fact.category)
            ?.color,
        }}
      >
        {fact.category}
      </span>
      <div className="vote-buttons">
        <button
          onClick={() => validate("votesInteresting")}
          disabled={isUpdating}
        >
          👍 {fact.votesInteresting}
        </button>
        <button
          onClick={() => validate("votesMindblowing")}
          disabled={isUpdating}
        >
          🤯 {fact.votesMindblowing}
        </button>
        <button onClick={() => validate("votesFalse")} disabled={isUpdating}>
          ⛔️ {fact.votesFalse}
        </button>
      </div>
    </li>
  );
}
function LoginForm({ setShowLoginForm }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLogin, setIsLogin] = useState("Sign Up");

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username);

    console.log("Fetch user result:", { data, error });

    if (error) {
      console.error("Error fetching user:", error);
      alert("There was a problem in fetching the users");
    } else {
      const user = data.find((user) => user.username === username);

      if (!user) {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert([{ username, password }])
          .select("id");

        if (!insertError) {
          Cookies.set("username", username, { expires: 30 });
          Cookies.set("user_id", newUser[0].id, { expires: 30 });
          // window.location.reload();
          setUsername("");
          setPassword("");
          setShowLoginForm(false);
        } else {
          console.error("Error inserting user:", insertError);
          alert("There was a problem in creating the user");
        }
      } else if (user) {
        if (isLogin && user.password !== password) {
          setErrorMsg("Invalid password");
          setIsLoading(false);
          return;
        }

        Cookies.set("username", username, { expires: 30 });
        Cookies.set("user_id", user.id, { expires: 30 });
        // window.location.reload();
        setUsername("");
        setPassword("");
        setShowLoginForm(false);
      } else {
        alert("Invalid username or password");
      }
    }
    setIsLoading(false);
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
      />
      <br />
      <button type="submit" className="btn btn-large" disabled={isLoading}>
        {isLogin ? "Login" : "Sign Up"}
      </button>
      <p>{isLogin ? "Don't have an account?" : "Already have an account?"} </p>
      <a href="#" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Sign Up" : "Login"}
      </a>
      {errorMsg && <p className="error-message">{errorMsg}</p>}
    </form>
  );
}

export default App;
