import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  setDoc,
  getDocs,
  where,
  setLogLevel,
} from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "AIzaSyAf8Hb15q5oL7atYYdJSUbFcDs5ajlINU4",
        authDomain: "multer-50cc3.firebaseapp.com",
        projectId: "multer-50cc3",
        storageBucket: "multer-50cc3.firebasestorage.app",
        messagingSenderId: "560752738663",
        appId: "1:560752738663:web:601534a73b91278b72efc2",
        measurementId: "G-4B8XM426TJ",
      };

// --- App ID ---
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

export default function App() {
  // --- Firebase State ---
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- App State ---
  const [transactions, setTransactions] = useState([]);
  const [todos, setTodos] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [habits, setHabits] = useState([]);
  const [habitEntries, setHabitEntries] = useState([]);
  const [activeView, setActiveView] = useState("tracker");
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light")
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // --- Firebase Initialization and Auth ---
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    setLogLevel("Debug");
    const authInstance = getAuth(app);
    const dbInstance = getFirestore(app);
    setAuth(authInstance);
    setDb(dbInstance);
    const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Data Fetching ---
  useEffect(() => {
    if (db && user) {
      const dataTypes = [
        "transactions",
        "todos",
        "habits",
        "habitEntries",
        "budgets",
      ];
      const unsubscribers = dataTypes.map((type) => {
        const ref = collection(db, "artifacts", appId, "users", user.uid, type);
        return onSnapshot(
          ref,
          (snapshot) => {
            const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            switch (type) {
              case "transactions":
                setTransactions(
                  data.sort((a, b) => new Date(b.date) - new Date(a.date))
                );
                break;
              case "todos":
                setTodos(data);
                break;
              case "habits":
                setHabits(data);
                break;
              case "habitEntries":
                setHabitEntries(data);
                break;
              case "budgets":
                const budgetMap = snapshot.docs.reduce((acc, doc) => {
                  acc[doc.id] = { id: doc.id, ...doc.data() };
                  return acc;
                }, {});
                setBudgets(budgetMap);
                break;
              default:
                break;
            }
          },
          (err) => console.error(`Error fetching ${type}:`, err)
        );
      });
      return () => unsubscribers.forEach((unsub) => unsub());
    } else {
      // Clear all data on logout
      setTransactions([]);
      setTodos([]);
      setBudgets({});
      setHabits([]);
      setHabitEntries([]);
    }
  }, [db, user]);

  // --- Helper Components (Icons) ---
  const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
  const PlusIcon = () => <Icon path="M12 4.5v15m7.5-7.5h-15" />;
  const ArrowUpIcon = () => (
    <Icon path="m4.5 15.75 7.5-7.5 7.5 7.5" className="w-5 h-5" />
  );
  const ArrowDownIcon = () => (
    <Icon path="m19.5 8.25-7.5 7.5-7.5-7.5" className="w-5 h-5" />
  );
  const TrashIcon = () => (
    <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  );
  const ListIcon = () => (
    <Icon path="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  );
  const CalculatorIcon = () => (
    <Icon path="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm3-6h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm3-6h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008ZM6 18V7.5a2.25 2.25 0 0 1 2.25-2.25h3.75a2.25 2.25 0 0 1 2.25 2.25V18M6 18h12a2.25 2.25 0 0 0 2.25-2.25V7.5A2.25 2.25 0 0 0 18 5.25h-3.75m-7.5 0h-3.75A2.25 2.25 0 0 0 3 7.5V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V7.5a2.25 2.25 0 0 0-2.25-2.25H15M12 18h3" />
  );
  const TrophyIcon = () => (
    <Icon path="M16.5 18.75h-9a9.75 9.75 0 0 1-9-9.75V7.5a2.25 2.25 0 0 1 2.25-2.25h3.75a2.25 2.25 0 0 1 2.25 2.25v1.5m0-1.5V6.375c0-1.036.84-1.875 1.875-1.875h1.5c1.036 0 1.875.84 1.875 1.875v1.125m-1.5 0v1.5m0-1.5a2.25 2.25 0 0 1 2.25 2.25h3.75a2.25 2.25 0 0 1 2.25-2.25V7.5a9.75 9.75 0 0 1-9 9.75h-9Z" />
  );
  const StarIcon = () => (
    <Icon path="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  );
  const ChartPieIcon = () => (
    <Icon path="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
  );
  const ClipboardDocumentListIcon = () => (
    <Icon path="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25v8.25A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25h6a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25Z" />
  );
  const SunIcon = () => (
    <Icon path="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  );
  const MoonIcon = () => (
    <Icon path="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  );
  const LogoutIcon = () => (
    <Icon path="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  );
  const PiggyBankIcon = () => (
    <Icon path="M7.5 15.5V14.25a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5V15.5M10.5 14.25V11.25m0 0a1.5 1.5 0 0 1 3 0m-3 0a1.5 1.5 0 0 0-3 0m0 0H7.5m9 3.75H18a2.25 2.25 0 0 0 2.25-2.25V9.75A2.25 2.25 0 0 0 18 7.5h-1.5m-3 7.5V11.25m0-3.75H9.75a3.75 3.75 0 1 1 7.5 0H15m-3-3.75V3.75m0 0a1.5 1.5 0 0 1 1.5 1.5v1.5m-1.5-3a1.5 1.5 0 0 0-1.5 1.5v1.5" />
  );
  const FireIcon = () => (
    <Icon path="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.613a8.287 8.287 0 0 0 3-2.566 8.252 8.252 0 0 1 3.362-1.833zM16.5 7.5c0-1.84-1.49-3.33-3.33-3.33a3.33 3.33 0 0 0-3.34 3.33c0 1.84 1.49 3.33 3.34 3.33a3.33 3.33 0 0 0 3.33-3.33z" />
  );
  const MenuIcon = () => (
    <Icon path="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  );
  const ChevronDoubleLeftIcon = ({ className }) => (
    <Icon
      className={className}
      path="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
    />
  );
  const DocumentChartBarIcon = () => (
    <Icon path="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 1.5m-5.25-11.25L6.25 16.5m1.5-13.5L9 16.5m1.5-13.5l1.5 13.5m0-13.5L15 16.5m3-13.5L19.25 16.5" />
  );

  // --- Auth Component ---
  const AuthPage = ({ onLogin, onRegister }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      if (!email || !password) {
        setError("Please enter both email and password.");
        return;
      }
      try {
        if (isLogin) {
          await onLogin(email, password);
        } else {
          await onRegister(email, password);
        }
      } catch (authError) {
        setError(authError.message);
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
            {isLogin ? "Welcome Back!" : "Create Your Account"}
          </h2>
          {error && (
            <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg mb-4 text-sm text-center">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full mt-1 p-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
            />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full mt-1 p-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center p-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-transform transform hover:scale-105"
            >
              {isLogin ? "Log In" : "Register"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 ml-1"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </Card>
      </div>
    );
  };

  // --- UI Components ---
  const Card = ({ children, className = "" }) => (
    <div
      className={`bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 ${className}`}
    >
      {children}
    </div>
  );
  const SummaryCard = ({ title, amount, icon, colorClass }) => {
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
    return (
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {formattedAmount}
            </p>
          </div>
          <div className={`p-3 rounded-full ${colorClass}`}>{icon}</div>
        </div>
      </Card>
    );
  };
  const StatCard = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-300 mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-lg font-bold text-gray-800 dark:text-white">
          {value}
        </p>
      </div>
    </Card>
  );
  const ThemeToggle = ({ theme, onToggle, isSidebarOpen }) => (
    <button
      onClick={onToggle}
      className={`flex items-center justify-center w-full p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition`}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
      <span className={`ml-3 ${!isSidebarOpen && "hidden"}`}>Theme</span>
    </button>
  );

  // --- Transaction Components ---
  const TransactionForm = ({ onAddTransaction }) => {
    const [text, setText] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("expense");
    const [category, setCategory] = useState("Food");
    const [error, setError] = useState("");
    const expenseCategories = [
      "Food",
      "Transport",
      "Shopping",
      "Bills",
      "Entertainment",
      "Health",
      "Other",
    ];
    const incomeCategories = ["Salary", "Bonus", "Investment", "Gift", "Other"];
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!text || !amount) {
        setError("Please enter a description and amount.");
        return;
      }
      if (parseFloat(amount) <= 0) {
        setError("Amount must be positive.");
        return;
      }
      onAddTransaction({
        text,
        amount: parseFloat(amount),
        type,
        category,
        date: new Date().toISOString(),
      });
      setText("");
      setAmount("");
      setError("");
    };
    const categories =
      type === "expense" ? expenseCategories : incomeCategories;
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <h2 className="text-xl font-bold mb-4">Add Transaction</h2>
        {error && (
          <p className="text-red-500 bg-red-100 p-2 rounded-lg mb-4 text-sm">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Description"
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (₹)"
            className="w-full p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg"
          />
          <div className="flex space-x-4">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setCategory(e.target.value === "expense" ? "Food" : "Salary");
              }}
              className="w-1/2 p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-1/2 p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center p-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
          >
            <PlusIcon />
            <span className="ml-2">Add</span>
          </button>
        </form>
      </Card>
    );
  };
  const TransactionList = ({ transactions, onDeleteTransaction }) => (
    <Card className="col-span-1 md:col-span-2 lg:col-span-2">
      <h2 className="text-xl font-bold mb-4">Recent History</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transactions yet.</p>
        ) : (
          transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              {" "}
              <div className="flex items-center space-x-4">
                <div
                  className={`p-2 rounded-full ${
                    t.type === "income"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300"
                      : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300"
                  }`}
                >
                  {t.type === "income" ? <ArrowUpIcon /> : <ArrowDownIcon />}
                </div>
                <div>
                  <p className="font-semibold">{t.text}</p>
                  <p className="text-xs text-gray-500">
                    {t.category} &bull; {new Date(t.date).toLocaleDateString()}
                  </p>
                </div>
              </div>{" "}
              <div className="flex items-center space-x-4">
                <p
                  className={`font-bold ${
                    t.type === "income"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}₹
                  {t.amount.toLocaleString("en-IN")}
                </p>
                <button
                  onClick={() => onDeleteTransaction(t.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <TrashIcon />
                </button>
              </div>{" "}
            </div>
          ))
        )}
      </div>
    </Card>
  );

  // --- Charting Components ---
  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088FE",
    "#00C49F",
    "#FFBB28",
  ];
  const ExpensePieChart = ({ data, title = "Expense Breakdown" }) => {
    const chartData = useMemo(() => {
      const categoryTotals = data
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {});
      return Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }, [data]);
    if (chartData.length === 0)
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          <p className="text-gray-500">No expense data for this period.</p>
        </div>
      );
    return (
      <>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              labelLine={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
              }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                  >{`${(percent * 100).toFixed(0)}%`}</text>
                );
              }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `₹${value.toLocaleString("en-IN")}`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </>
    );
  };
  const IncomeExpenseBarChart = ({ data }) => {
    const chartData = useMemo(() => {
      const monthlyData = data.reduce((acc, t) => {
        const month = new Date(t.date).toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        if (!acc[month]) acc[month] = { name: month, income: 0, expense: 0 };
        if (t.type === "income") acc[month].income += t.amount;
        else acc[month].expense += t.amount;
        return acc;
      }, {});
      return Object.values(monthlyData).reverse();
    }, [data]);
    if (chartData.length === 0)
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No data for the bar chart yet.</p>
        </div>
      );
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" tickFormatter={(v) => `₹${v / 1000}k`} />
          <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
          <Legend />
          <Bar
            dataKey="income"
            fill="#82ca9d"
            name="Income"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expense"
            fill="#ff8042"
            name="Expense"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // --- Budget Components ---
  const BudgetManager = ({ budgets, onSetBudget }) => {
    const expenseCategories = [
      "Food",
      "Transport",
      "Shopping",
      "Bills",
      "Entertainment",
      "Health",
      "Other",
    ];
    const [category, setCategory] = useState("Food");
    const [limit, setLimit] = useState("");
    const handleSubmit = (e) => {
      e.preventDefault();
      if (parseFloat(limit) > 0) {
        onSetBudget(category, parseFloat(limit));
        setLimit("");
      }
    };
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Set Monthly Budget
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg"
            >
              {expenseCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder={`Limit for ${category}`}
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg"
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center p-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
            >
              Set Budget
            </button>
          </form>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Current Budgets
          </h2>
          <div className="space-y-3">
            {expenseCategories.map((cat) => (
              <div
                key={cat}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {cat}
                </span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {budgets[cat]
                    ? `₹${budgets[cat].limit.toLocaleString("en-IN")}`
                    : "Not Set"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };
  const BudgetStatus = ({ transactions, budgets }) => {
    const budgetData = useMemo(() => {
      const firstDay = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );
      const currentMonthExpenses = transactions.filter(
        (t) => t.type === "expense" && new Date(t.date) >= firstDay
      );
      const expensesByCategory = currentMonthExpenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
      return Object.keys(budgets)
        .map((category) => {
          const spent = expensesByCategory[category] || 0;
          const limit = budgets[category].limit;
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;
          return { category, spent, limit, percentage };
        })
        .filter((b) => b.limit > 0);
    }, [transactions, budgets]);

    if (budgetData.length === 0)
      return (
        <Card>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Budget Status
          </h2>
          <p className="text-gray-500">
            Set some budgets to see your progress!
          </p>
        </Card>
      );

    return (
      <Card>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Monthly Budget Status
        </h2>
        <div className="space-y-4">
          {budgetData.map(({ category, spent, limit, percentage }) => (
            <div key={category}>
              <div className="flex justify-between mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                <span>{category}</span>
                <span>
                  ₹{spent.toLocaleString("en-IN")} / ₹
                  {limit.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className={`${
                    percentage > 100 ? "bg-red-500" : "bg-indigo-600"
                  } h-2.5 rounded-full`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // --- To-Do Components ---
  const TodoList = ({ todos, onAddTodo, onDeleteTodo, onToggleTodo }) => {
    const [text, setText] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [sortBy, setSortBy] = useState("default");

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!text.trim()) return;
      onAddTodo({ text, completed: false, dueDate, priority });
      setText("");
      setDueDate("");
      setPriority("Medium");
    };

    const sortedTodos = useMemo(() => {
      const incomplete = todos.filter((t) => !t.completed);
      const complete = todos.filter((t) => t.completed);
      const sortFn = (a, b) => {
        if (sortBy === "dueDate")
          return a.dueDate && b.dueDate
            ? new Date(a.dueDate) - new Date(b.dueDate)
            : a.dueDate
            ? -1
            : 1;
        if (sortBy === "priority") {
          const pOrder = { High: 1, Medium: 2, Low: 3 };
          return pOrder[a.priority] - pOrder[b.priority];
        }
        return 0; // default order
      };
      return [...incomplete.sort(sortFn), ...complete.sort(sortFn)];
    }, [todos, sortBy]);

    const PriorityBadge = ({ priority }) => {
      const colors = {
        High: "bg-red-100 text-red-800",
        Medium: "bg-yellow-100 text-yellow-800",
        Low: "bg-green-100 text-green-800",
      };
      return (
        <span
          className={`text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${colors[priority]}`}
        >
          {priority}
        </span>
      );
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <h2 className="text-xl font-bold mb-4">Add a Task</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., Pay electricity bill"
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <button
              type="submit"
              className="w-full p-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
            >
              Add Task
            </button>
          </form>
        </Card>
        <Card className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Tasks</h2>
            <select
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 bg-gray-100 dark:bg-gray-700 border rounded-lg text-sm"
            >
              <option value="default">Sort by Default</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>
          <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-2">
            {sortedTodos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                You have no tasks!
              </p>
            ) : (
              sortedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => onToggleTodo(todo.id, todo.completed)}
                      className="h-5 w-5 mt-1 rounded border-gray-300 text-indigo-600"
                    />
                    <div>
                      <span
                        className={`font-medium ${
                          todo.completed ? "line-through text-gray-400" : ""
                        }`}
                      >
                        {todo.text}
                      </span>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <PriorityBadge priority={todo.priority} />
                        {todo.dueDate && (
                          <span>
                            Due: {new Date(todo.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteTodo(todo.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  };

  // --- Habit Tracker Components ---
  const HabitTracker = ({
    habits,
    habitEntries,
    onAddHabit,
    onDeleteHabit,
    onLogHabit,
  }) => {
    const [name, setName] = useState("");
    const handleSubmit = (e) => {
      e.preventDefault();
      if (name.trim()) {
        onAddHabit(name);
        setName("");
      }
    };
    const todayStr = new Date().toISOString().split("T")[0];

    const habitsWithStreaks = useMemo(() => {
      return habits.map((habit) => {
        const entriesForHabit = habitEntries
          .filter((e) => e.habitId === habit.id)
          .map((e) => e.date)
          .sort()
          .reverse();
        let streak = 0;
        if (entriesForHabit.length > 0) {
          const today = new Date(todayStr);
          const lastEntryDate = new Date(entriesForHabit[0]);
          const diffTime = today - lastEntryDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 1) {
            // Logged today or yesterday
            streak = 1;
            let currentDate = new Date(entriesForHabit[0]);
            for (let i = 1; i < entriesForHabit.length; i++) {
              const prevDate = new Date(entriesForHabit[i]);
              const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
              if (dayDiff === 1) {
                streak++;
                currentDate = prevDate;
              } else {
                break;
              }
            }
          }
        }
        return {
          ...habit,
          streak,
          isDoneToday: entriesForHabit.includes(todayStr),
        };
      });
    }, [habits, habitEntries, todayStr]);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <h2 className="text-xl font-bold mb-4">Add a Habit</h2>
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Exercise"
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 border rounded-lg"
            />
            <button
              type="submit"
              className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon />
            </button>
          </form>
        </Card>
        <Card className="md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Today's Habits</h2>
          <div className="space-y-3">
            {habitsWithStreaks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Add a habit to get started!
              </p>
            ) : (
              habitsWithStreaks.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center">
                    <button
                      onClick={() =>
                        onLogHabit(habit.id, todayStr, habit.isDoneToday)
                      }
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        habit.isDoneToday
                          ? "bg-green-500 border-green-600"
                          : "border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    ></button>
                    <span className="ml-4 font-semibold">{habit.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-lg text-yellow-500 mr-4">
                      {habit.streak}
                    </span>
                    <FireIcon className="w-6 h-6 text-yellow-500 mr-4" />
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  };

  // --- Reports Components ---
  const ReportsDashboard = ({ allTransactions }) => {
    const today = new Date();
    const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));
    const [startDate, setStartDate] = useState(
      thirtyDaysAgo.toISOString().split("T")[0]
    );
    const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

    const filteredTransactions = useMemo(() => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the whole end day
      return allTransactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= start && tDate <= end;
      });
    }, [allTransactions, startDate, endDate]);

    const reportStats = useMemo(() => {
      const income = filteredTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = filteredTransactions.filter((t) => t.type === "expense");
      const expenseTotal = expenses.reduce((sum, t) => sum + t.amount, 0);

      if (expenses.length === 0)
        return {
          income,
          expenseTotal,
          net: income - expenseTotal,
          avgDaily: 0,
          topCategory: "N/A",
          topDay: "N/A",
        };

      const expensesByDay = expenses.reduce((acc, t) => {
        const day = t.date.split("T")[0];
        acc[day] = (acc[day] || 0) + t.amount;
        return acc;
      }, {});

      const topDay = Object.entries(expensesByDay).reduce(
        (max, entry) => (entry[1] > max[1] ? entry : max),
        ["", 0]
      );
      const dayCount =
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;

      const expensesByCategory = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
      const topCategory =
        Object.keys(expensesByCategory).length > 0
          ? Object.entries(expensesByCategory).reduce(
              (max, entry) => (entry[1] > max[1] ? entry : max),
              ["", 0]
            )[0]
          : "N/A";

      return {
        income,
        expenseTotal,
        net: income - expenseTotal,
        avgDaily: expenseTotal / dayCount,
        topCategory: topCategory,
        topDay: topDay[0]
          ? new Date(topDay[0]).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "N/A",
      };
    }, [filteredTransactions, startDate, endDate]);

    const spendingOverTimeData = useMemo(() => {
      const expenses = filteredTransactions.filter((t) => t.type === "expense");
      const dataByDay = expenses.reduce((acc, t) => {
        const day = t.date.split("T")[0];
        acc[day] = (acc[day] || 0) + t.amount;
        return acc;
      }, {});
      return Object.entries(dataByDay)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [filteredTransactions]);

    const setDatePreset = (days) => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      setEndDate(end.toISOString().split("T")[0]);
      setStartDate(start.toISOString().split("T")[0]);
    };

    return (
      <div className="space-y-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">Financial Report</h2>
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 bg-gray-100 dark:bg-gray-700 border rounded-lg"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 bg-gray-100 dark:bg-gray-700 border rounded-lg"
            />
            <button
              onClick={() => setDatePreset(30)}
              className="px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg text-sm"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDatePreset(90)}
              className="px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg text-sm"
            >
              Last 90 Days
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Total Income"
            amount={reportStats.income}
            icon={<ArrowUpIcon />}
            colorClass="bg-green-100 text-green-600"
          />
          <SummaryCard
            title="Total Expense"
            amount={reportStats.expenseTotal}
            icon={<ArrowDownIcon />}
            colorClass="bg-red-100 text-red-600"
          />
          <SummaryCard
            title="Net Savings"
            amount={reportStats.net}
            icon={<PiggyBankIcon />}
            colorClass={`bg-blue-100 text-blue-600`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Avg. Daily Spend"
            value={`₹${reportStats.avgDaily.toFixed(2)}`}
            icon={<CalculatorIcon />}
          />
          <StatCard
            title="Top Category"
            value={reportStats.topCategory}
            icon={<StarIcon />}
          />
          <StatCard
            title="Highest Spend Day"
            value={reportStats.topDay}
            icon={<TrophyIcon />}
          />
          <StatCard
            title="# of Transactions"
            value={filteredTransactions.length}
            icon={<ListIcon />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-bold mb-4">Spending Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Spent"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <ExpensePieChart
              data={filteredTransactions}
              title="Expense Breakdown for Period"
            />
          </Card>
        </div>
      </div>
    );
  };

  // --- Dashboard View ---
  const ExpenseTrackerDashboard = (props) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {" "}
        <SummaryCard
          title="Total Income"
          amount={props.income}
          icon={<ArrowUpIcon />}
          colorClass="bg-green-100 text-green-600"
        />{" "}
        <SummaryCard
          title="Total Expense"
          amount={props.expense}
          icon={<ArrowDownIcon />}
          colorClass="bg-red-100 text-red-600"
        />{" "}
        <Card className="flex flex-col justify-center items-center md:col-span-2 xl:col-span-1">
          <p className="text-sm text-gray-500">Current Balance</p>
          <p
            className={`text-3xl font-bold ${
              props.balance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(props.balance)}
          </p>
        </Card>{" "}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {" "}
        <StatCard
          title="Transactions"
          value={props.transactionCount}
          icon={<ListIcon />}
        />{" "}
        <StatCard
          title="Avg. Expense"
          value={new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(props.averageExpense)}
          icon={<CalculatorIcon />}
        />{" "}
        <StatCard
          title="Highest Expense"
          value={new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(props.highestExpense)}
          icon={<TrophyIcon />}
        />{" "}
        <StatCard
          title="Top Category"
          value={props.topCategory}
          icon={<StarIcon />}
        />{" "}
      </div>
      <BudgetStatus transactions={props.transactions} budgets={props.budgets} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {" "}
        <TransactionForm onAddTransaction={props.onAddTransaction} />{" "}
        <TransactionList
          transactions={props.transactions}
          onDeleteTransaction={props.onDeleteTransaction}
        />{" "}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {" "}
        <Card>
          <ExpensePieChart data={props.transactions} />
        </Card>{" "}
        <Card>
          <h2 className="text-xl font-bold mb-4">Monthly Overview</h2>
          <IncomeExpenseBarChart data={props.transactions} />
        </Card>{" "}
      </div>
    </div>
  );

  // --- App Logic & Firebase Handlers ---
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const handleRegister = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);
  const handleLogin = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);
  const handleLogout = () => signOut(auth);
  const getCollectionRef = (name) =>
    collection(db, "artifacts", appId, "users", user.uid, name);
  const addTransaction = (data) =>
    addDoc(getCollectionRef("transactions"), data);
  const deleteTransaction = (id) =>
    deleteDoc(doc(getCollectionRef("transactions"), id));
  const addTodo = (data) => addDoc(getCollectionRef("todos"), data);
  const deleteTodo = (id) => deleteDoc(doc(getCollectionRef("todos"), id));
  const toggleTodo = (id, status) =>
    updateDoc(doc(getCollectionRef("todos"), id), { completed: !status });
  const setBudget = (category, limit) =>
    setDoc(doc(getCollectionRef("budgets"), category), { limit });
  const addHabit = (name) =>
    addDoc(getCollectionRef("habits"), { name, createdAt: new Date() });
  const deleteHabit = (id) => deleteDoc(doc(getCollectionRef("habits"), id));
  const logHabit = async (habitId, dateStr, isDone) => {
    if (isDone) {
      const q = query(
        getCollectionRef("habitEntries"),
        where("habitId", "==", habitId),
        where("date", "==", dateStr)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => deleteDoc(doc.ref));
    } else {
      addDoc(getCollectionRef("habitEntries"), { habitId, date: dateStr });
    }
  };
  const {
    income,
    expense,
    balance,
    transactionCount,
    averageExpense,
    highestExpense,
    topCategory,
  } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenseTx = transactions.filter((t) => t.type === "expense");
    const expense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    const categoryTotals = expenseTx.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    return {
      income,
      expense,
      balance: income - expense,
      transactionCount: transactions.length,
      averageExpense: expenseTx.length > 0 ? expense / expenseTx.length : 0,
      highestExpense:
        expenseTx.length > 0 ? Math.max(...expenseTx.map((t) => t.amount)) : 0,
      topCategory:
        Object.keys(categoryTotals).length > 0
          ? Object.entries(categoryTotals).reduce((a, b) =>
              a[1] > b[1] ? a : b
            )[0]
          : "N/A",
    };
  }, [transactions]);

  const NavButton = ({ view, label, icon, isSidebarOpen, onClick }) => (
    <button
      onClick={() => {
        setActiveView(view);
        onClick && onClick();
      }}
      className={`flex items-center w-full text-left p-3 my-1 rounded-lg font-semibold transition-colors ${
        activeView === view
          ? "bg-indigo-600 text-white shadow-md"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      {icon}
      <span
        className={`ml-4 transition-opacity duration-200 ${
          !isSidebarOpen && "opacity-0 hidden"
        }`}
      >
        {label}
      </span>
    </button>
  );

  const Sidebar = ({ onNavItemClick }) => (
    <aside
      className={`relative bg-white dark:bg-gray-800 shadow-xl h-screen flex flex-col transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {" "}
        <h1
          className={`text-2xl font-bold text-indigo-600 dark:text-indigo-400 transition-opacity ${
            !isSidebarOpen && "opacity-0 hidden"
          }`}
        >
          Multer
        </h1>{" "}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {" "}
          <ChevronDoubleLeftIcon
            className={`w-6 h-6 transition-transform duration-300 ${
              !isSidebarOpen && "rotate-180"
            }`}
          />{" "}
        </button>{" "}
      </div>
      <nav className="flex-1 px-3 py-4">
        <NavButton
          view="tracker"
          label="Tracker"
          icon={<ChartPieIcon />}
          isSidebarOpen={isSidebarOpen}
          onClick={onNavItemClick}
        />
        <NavButton
          view="reports"
          label="Reports"
          icon={<DocumentChartBarIcon />}
          isSidebarOpen={isSidebarOpen}
          onClick={onNavItemClick}
        />
        <NavButton
          view="todo"
          label="To-Do"
          icon={<ClipboardDocumentListIcon />}
          isSidebarOpen={isSidebarOpen}
          onClick={onNavItemClick}
        />
        <NavButton
          view="budgets"
          label="Budgets"
          icon={<PiggyBankIcon />}
          isSidebarOpen={isSidebarOpen}
          onClick={onNavItemClick}
        />
        <NavButton
          view="habits"
          label="Habits"
          icon={<FireIcon />}
          isSidebarOpen={isSidebarOpen}
          onClick={onNavItemClick}
        />
      </nav>
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-2">
          {" "}
          <ThemeToggle
            theme={theme}
            onToggle={toggleTheme}
            isSidebarOpen={isSidebarOpen}
          />{" "}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Sign Out"
        >
          {" "}
          <LogoutIcon />{" "}
          <span className={`ml-4 ${!isSidebarOpen && "hidden"}`}>
            Logout
          </span>{" "}
        </button>
        <div className={`pt-4 text-center ${!isSidebarOpen && "hidden"}`}>
          {" "}
          <p className="text-xs text-gray-500 truncate" title={user.email}>
            {user.email}
          </p>{" "}
        </div>
      </div>
    </aside>
  );

  // --- App Render ---
  if (!isAuthReady)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading App...</div>
      </div>
    );
  if (!user)
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavItemClick={() => setIsMobileMenuOpen(false)} />
        <div
          className="flex-shrink-0 w-14 bg-black bg-opacity-25"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-gray-800/50 p-4 flex justify-between items-center shadow-md">
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Multer
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <MenuIcon />
          </button>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeView === "tracker" && (
            <ExpenseTrackerDashboard
              {...{
                income,
                expense,
                balance,
                transactionCount,
                averageExpense,
                highestExpense,
                topCategory,
                transactions,
                onAddTransaction: addTransaction,
                onDeleteTransaction: deleteTransaction,
                budgets,
              }}
            />
          )}
          {activeView === "reports" && (
            <ReportsDashboard allTransactions={transactions} />
          )}
          {activeView === "todo" && (
            <TodoList
              todos={todos}
              onAddTodo={addTodo}
              onDeleteTodo={deleteTodo}
              onToggleTodo={toggleTodo}
            />
          )}
          {activeView === "budgets" && (
            <BudgetManager budgets={budgets} onSetBudget={setBudget} />
          )}
          {activeView === "habits" && (
            <HabitTracker
              habits={habits}
              habitEntries={habitEntries}
              onAddHabit={addHabit}
              onDeleteHabit={deleteHabit}
              onLogHabit={logHabit}
            />
          )}
        </main>
      </div>
    </div>
  );
}
