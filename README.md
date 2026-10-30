# Authentication Context Architecture

This project uses React Context to manage authentication state across the application.

## Overview

The authentication state is managed centrally inside:

```text
src/
├── context/
│   └── AuthContext.jsx
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx
│   └── Profile.jsx
├── components2/
│   └── Navbar.jsx
├── App.jsx
└── main.jsx
```

The main idea is:

```text
                 AuthProvider
                      │
                      │
             Authentication State
                      │
        ┌─────────────┼─────────────┐
        │             │             │
      Home          Login         Profile
        │             │             │
        └─────────────┼─────────────┘
                      │
                 useContext()
```

## AuthContext

`AuthContext.jsx` is responsible for managing the authentication state.

It stores the current user:

```jsx
const [user, setUser] = useState({
    name: "",
    isAuth: false,
});
```

It also provides authentication actions:

```jsx
login()
logout()
```

The context makes these available to the rest of the application:

```jsx
<AuthContext.Provider value={{ user, login, logout }}>
    {children}
</AuthContext.Provider>
```

The context does **not** render pages or handle routing.

Its responsibility is simply to manage and provide authentication state.

## App.jsx

`App.jsx` is responsible for putting the application together.

It provides the `AuthProvider` around the application and defines the routes.

```jsx
<AuthProvider>
    <Navbar />

    <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
    </Routes>
</AuthProvider>
```

The authentication logic should not be duplicated inside `App.jsx`.

## Pages

The pages consume authentication information from the context.

### Home

The Home page can access the current user:

```jsx
const { user } = useContext(AuthContext);
```

For example:

```jsx
<h1>Welcome {user.name}</h1>
```

### Login

The Login page uses the `login()` function from the context:

```jsx
const { login } = useContext(AuthContext);
```

After the user submits the login form:

```jsx
login(username);
```

The context updates the global authentication state.

Any component using the context will then receive the updated user.

### Profile

The Profile page can access the current user:

```jsx
const { user, logout } = useContext(AuthContext);
```

It can display user information:

```jsx
<h1>{user.name}</h1>
```

and allow the user to log out:

```jsx
<button onClick={logout}>
    Logout
</button>
```

## Data Flow

The authentication flow is:

```text
Login Page
    │
    │ login(username)
    ▼
AuthContext
    │
    │ updates user
    ▼
Global authentication state
    │
    ├── Home
    ├── Navbar
    └── Profile
```

When the user logs out:

```text
Profile / Navbar
       │
       │ logout()
       ▼
AuthContext
       │
       │ user becomes unauthenticated
       ▼
Application
```

## Responsibility Rules

Keep responsibilities separated.

### AuthContext is responsible for:

* Current user
* Authentication status
* Login action
* Logout action
* Authentication-related state

### Pages are responsible for:

* Displaying UI
* Handling page-specific interactions
* Consuming authentication state
* Calling authentication actions when necessary

### App.jsx is responsible for:

* Application structure
* Providers
* Routes
* Global layout

### Components are responsible for:

* Reusable UI
* Consuming context when they need authentication information

## Important

The current context is only **client-side state**.

For a production application, authentication should eventually be connected to the backend.

The frontend context should represent the authentication state, but it should not be treated as the actual security mechanism.

The backend must still verify authentication and authorization for protected operations.

A future production authentication flow should look like:

```text
User
 │
 ▼
Login Page
 │
 ▼
Backend Authentication
 │
 ▼
Session / Token
 │
 ▼
AuthContext
 │
 ▼
Application
```

The React Context is therefore the application's **central place for accessing authentication state**, not the system that actually authenticates or authorizes the user.
