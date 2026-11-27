import "@/lib/i18n";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BirthDateField, formatBirthDateDigits, parseBirthDateText } from "./BirthDateField";
import { NationalitySelect, TYPEAHEAD_RESET_MS } from "./NationalitySelect";

describe("birth date text helpers", () => {
  it("adds slashes as digits are typed, without trailing slashes", () => {
    expect(formatBirthDateDigits("17")).toBe("17");
    expect(formatBirthDateDigits("170")).toBe("17/0");
    expect(formatBirthDateDigits("17/05/1990")).toBe("17/05/1990");
    expect(formatBirthDateDigits("17051990123")).toBe("17/05/1990");
  });

  it("parses complete, incomplete and impossible dates", () => {
    expect(parseBirthDateText("")).toEqual({ value: "", status: "empty" });
    expect(parseBirthDateText("17/05")).toEqual({ value: "", status: "incomplete" });
    expect(parseBirthDateText("17/05/1990")).toEqual({ value: "1990-05-17", status: "complete" });
    expect(parseBirthDateText("31/02/1990")).toEqual({ value: "", status: "invalid" });
    expect(parseBirthDateText("10/13/1990")).toEqual({ value: "", status: "invalid" });
  });
});

describe("BirthDateField", () => {
  it("shows the stored date and emits typed dates", () => {
    const onChange = vi.fn();
    render(<BirthDateField value="1990-05-17" onChange={onChange} />);
    const input = screen.getByPlaceholderText("dd/mm/aaaa");
    expect(input).toHaveValue("17/05/1990");

    fireEvent.change(input, { target: { value: "01021985" } });
    expect(input).toHaveValue("01/02/1985");
    expect(onChange).toHaveBeenLastCalledWith("1985-02-01", "complete");

    fireEvent.change(input, { target: { value: "01/02" } });
    expect(onChange).toHaveBeenLastCalledWith("", "incomplete");
  });

  it("picks a date from the calendar using the month and year selects", () => {
    const onChange = vi.fn();
    render(<BirthDateField value="" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir calendario" }));
    const calendar = screen.getByRole("dialog");
    fireEvent.change(within(calendar).getByLabelText("Año"), { target: { value: "1990" } });
    fireEvent.change(within(calendar).getByLabelText("Mes"), { target: { value: "5" } });
    fireEvent.click(within(calendar).getByRole("button", { name: "17" }));

    expect(onChange).toHaveBeenLastCalledWith("1990-05-17", "complete");
    expect(screen.getByPlaceholderText("dd/mm/aaaa")).toHaveValue("17/05/1990");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("disables future days", () => {
    render(<BirthDateField value="" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir calendario" }));
    const calendar = screen.getByRole("dialog");
    const now = new Date();
    fireEvent.change(within(calendar).getByLabelText("Año"), { target: { value: String(now.getFullYear()) } });
    fireEvent.change(within(calendar).getByLabelText("Mes"), { target: { value: String(now.getMonth() + 1) } });
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() < lastDay) {
      expect(within(calendar).getByRole("button", { name: String(lastDay) })).toBeDisabled();
    }
    expect(within(calendar).getByRole("button", { name: String(now.getDate()) })).toBeEnabled();
  });
});

describe("NationalitySelect", () => {
  const activeOption = () => {
    const combobox = screen.getByRole("combobox");
    const id = combobox.getAttribute("aria-activedescendant");
    return id ? document.getElementById(id) : null;
  };

  it("shows the selected country with its flag, also for a legacy country name", () => {
    const { rerender } = render(<NationalitySelect value="AR" onChange={vi.fn()} />);
    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveTextContent("Argentina");
    expect(combobox.querySelector("img")?.getAttribute("src")).toContain("/flags/ar.svg");

    rerender(<NationalitySelect value="argentina" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Argentina");
  });

  it("keeps an unknown legacy value visible instead of erasing it", () => {
    render(<NationalitySelect value="Argentino" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Argentino");
  });

  it("type-ahead uses consecutive keys: 'a', 'r', 'g' lands on Argelia, not on the first 'g' country", () => {
    const onChange = vi.fn();
    render(<NationalitySelect value="" onChange={onChange} />);
    const combobox = screen.getByRole("combobox");

    for (const key of ["a", "r", "g"]) fireEvent.keyDown(combobox, { key });
    expect(activeOption()).toHaveTextContent("Argelia");

    fireEvent.keyDown(combobox, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("DZ");
  });

  it("restarts the search after a pause", () => {
    vi.useFakeTimers();
    render(<NationalitySelect value="" onChange={vi.fn()} />);
    const combobox = screen.getByRole("combobox");

    fireEvent.keyDown(combobox, { key: "a" });
    act(() => {
      vi.advanceTimersByTime(TYPEAHEAD_RESET_MS + 50);
    });
    fireEvent.keyDown(combobox, { key: "g" });
    expect(activeOption()).toHaveTextContent("Gabón");
  });

  it("selects with the mouse and closes on Escape without closing parents", () => {
    const onChange = vi.fn();
    render(<NationalitySelect value="" onChange={onChange} />);
    const combobox = screen.getByRole("combobox");

    fireEvent.click(combobox);
    fireEvent.click(screen.getByRole("option", { name: "Uruguay" }));
    expect(onChange).toHaveBeenCalledWith("UY");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.click(combobox);
    const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    act(() => {
      combobox.dispatchEvent(escape);
    });
    expect(escape.defaultPrevented).toBe(true);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
