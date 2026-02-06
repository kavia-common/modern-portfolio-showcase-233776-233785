import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the portfolio hero heading", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", {
      name: /modern, accessible interfaces/i,
      level: 1,
    })
  ).toBeInTheDocument();
});
