const ReactDOM = (function () {
  let _container;
  let _Component;

  return {
    update() {
      this.render(_container, _Component);
    },
    render(container, Component) {
      _container = container;
      _Component = Component;

      const focusedElementId = document.activeElement.id;
      const focusedElementSelectionStart =
        document.activeElement.selectionStart;
      const focusedElementSelectionEnd = document.activeElement.selectionEnd;

      const componentDOM = React.render(Component);
      container.replaceChildren();
      container.appendChild(componentDOM);

      if (focusedElementId) {
        const focusedElement = document.getElementById(focusedElementId);
        focusedElement.focus();
        focusedElement.selectionStart = focusedElementSelectionStart;
        focusedElement.selectionEnd = focusedElementSelectionEnd;
      }
    },
  };
})();

const React = (function () {
  let hooks = [];
  let currentIndex = 0;

  return {
    render(Component) {
      currentIndex = 0;

      const Comp = Component();
      return Comp;
    },
    useState(initialValue) {
      const useStateIndex = currentIndex;
      currentIndex++;

      hooks[useStateIndex] = hooks[useStateIndex] ?? initialValue;

      const setState = (newVal) => {
        const newState =
          typeof newVal === "function" ? newVal(hooks[useStateIndex]) : newVal;
        hooks[useStateIndex] = newState;
        ReactDOM.update();
      };

      return [hooks[useStateIndex], setState];
    },
    useReducer(reducer, initialState) {
      const useReducerIndex = currentIndex;
      currentIndex++;

      hooks[useReducerIndex] = hooks[useReducerIndex] ?? initialState;

      const dispatch = (action) => {
        const newState = reducer(hooks[useReducerIndex], action);
        hooks[useReducerIndex] = newState;
        ReactDOM.update();
      };

      return [hooks[useReducerIndex], dispatch];
    },
    useEffect(callback, depArray) {
      const hasNoDeps = !depArray;
      const deps = hooks[currentIndex];
      const hasChangedDeps = deps
        ? !depArray.every((el, i) => el === deps[i])
        : true;
      if (hasNoDeps || hasChangedDeps) {
        callback();
        hooks[currentIndex] = depArray;
      }
      currentIndex++;
    },
  };
})();

function Link(props) {
  const a = document.createElement("a");
  a.href = props.href;
  a.textContent = props.label;
  a.onclick = function (event) {
    event.preventDefault();
    props.onClick();
  };
  return a;
}

function AboutPage(props) {
  const linkHome = Link({
    href: "#home",
    label: "Back to Home",
    onClick: props.onLinkHomeClick,
  });

  const p = document.createElement("p");
  p.textContent = "Welcome to About Page";

  const div = document.createElement("div");
  div.appendChild(linkHome);
  div.appendChild(p);
  return div;
}

function Navbar(props) {
  const linkHome = Link({
    href: "#home",
    label: "Home",
    onClick: props.onLinkHomeClick,
  });
  const linkAbout = Link({
    href: "#about",
    label: "About",
    onClick: props.onLinkAboutClick,
  });

  const div = document.createElement("div");
  div.append(linkHome);
  div.append(linkAbout);

  return div;
}

function ProductSearchInput(props) {
  const input = document.createElement("input");
  input.id = "input";
  input.value = props.inputValue;
  input.placeholder = "enter your name";
  input.disabled = props.loading;
  input.oninput = function (event) {
    props.onInputChange(event.target.value);
  };

  const buttonClear = document.createElement("button");
  buttonClear.textContent = "Clear";
  buttonClear.disabled = props.loading;
  buttonClear.onclick = function () {
    props.onButtonClearClick();
  };

  const buttonSubmit = document.createElement("button");
  buttonSubmit.textContent = "Submit";
  buttonSubmit.disabled = props.loading;
  buttonSubmit.onclick = function () {
    props.onButtonSubmitClick();
  };

  const div = document.createElement("div");
  div.append(input);
  div.append(buttonClear);
  div.append(buttonSubmit);

  return div;
}

function ProductItem(props) {
  const titleText = document.createElement("p");
  titleText.textContent = props.title;
  return titleText;
}

function ProductList(props) {
  const items = props.products.map((product) =>
    ProductItem({ title: product.title })
  );

  const loadingText = document.createElement("p");
  loadingText.textContent = "Loading Products...";

  const emptyText = document.createElement("p");
  emptyText.textContent = "Product Empty";

  const errorText = document.createElement("p");
  errorText.textContent = props.errorMessage;

  const div = document.createElement("div");

  if (props.loading) {
    div.append(loadingText);
  } else if (props.errorMessage !== "") {
    div.append(errorText);
  } else if (props.products.length == 0) {
    div.append(emptyText);
  } else {
    div.append(...items);
  }

  return div;
}

function HomePage(props) {
  const [inputValue, setInputValue] = React.useState(
    localStorage.getItem("inputValue") ?? ""
  );

  React.useEffect(() => {
    localStorage.setItem("inputValue", inputValue);
  }, [inputValue]);

  const [loading, setLoading] = React.useState(false);

  const [products, setProducts] = React.useState([]);

  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    if (loading) {
      fetch("https://dummyjson.com/products/search?q=" + inputValue)
        .then((res) => res.json())
        .then((data) => {
          setLoading(false);
          setProducts(data.products);
          setErrorMessage("");
        })
        .catch((err) => {
          setLoading(false);
          setProducts([]);
          setErrorMessage(err.message);
        });
    }
  }, [loading, inputValue]);

  const navbar = Navbar({
    onLinkHomeClick: props.onLinkHomeClick,
    onLinkAboutClick: props.onLinkAboutClick,
  });

  const productSearchInput = ProductSearchInput({
    inputValue,
    loading,
    onInputChange: (newInputValue) => setInputValue(newInputValue),
    onButtonClearClick: () => setInputValue(""),
    onButtonSubmitClick: () => setLoading(true),
  });

  const productList = ProductList({
    products,
    loading,
    errorMessage,
  });

  const p = document.createElement("p");
  p.textContent = "Welcome to Home Page";

  const textPreview = document.createElement("p");
  textPreview.textContent = inputValue;

  const div = document.createElement("div");
  div.append(navbar);
  div.append(p);
  div.append(productSearchInput);
  div.append(textPreview);
  div.append(productList);

  return div;
}

function App() {
  const [hash, setHash] = React.useState(window.location.hash);

  React.useEffect(() => {
    history.pushState(null, "", hash);
  }, [hash]);

  const onLinkHomeClick = () => {
    setHash("#home");
  };

  const onLinkAboutClick = () => {
    setHash("#about");
  };

  const homePage = HomePage({ onLinkHomeClick, onLinkAboutClick });
  const aboutPage = AboutPage({ onLinkHomeClick });

  if (hash == "#home") {
    return homePage;
  } else if (hash == "#about") {
    return aboutPage;
  } else {
    return homePage;
  }
}

const root = document.getElementById("root");
ReactDOM.render(root, App);
