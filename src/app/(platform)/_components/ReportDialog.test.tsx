import "@/lib/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

const createContentReportMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/report", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/report")>()),
  createContentReport: createContentReportMock
}));

import { ReportDialog } from "./ReportDialog";

function okResponse(alreadyReported: boolean) {
  return { success: true, message: "OK", data: { alreadyReported, report: { id: "r1" } } };
}

function renderDialog() {
  const onClose = vi.fn();
  render(<ReportDialog target={{ type: "FEED_POST", id: "p1" }} onClose={onClose} />);
  return { onClose };
}

function selectReason(value: string) {
  fireEvent.change(screen.getByLabelText("Motivo"), { target: { value } });
}

const submitButton = () => screen.getByRole("button", { name: "Enviar denuncia" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReportDialog", () => {
  it("renders nothing without a target", () => {
    render(<ReportDialog target={null} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("needs a reason before sending, then sends it with the details", async () => {
    createContentReportMock.mockResolvedValue(okResponse(false));
    const { onClose } = renderDialog();

    expect(screen.getByRole("dialog", { name: "Denunciar publicación" })).toBeInTheDocument();
    expect(screen.getByLabelText("Motivo")).toHaveValue("");
    expect(screen.getByRole("option", { name: "Seleccioná un motivo" })).toBeDisabled();
    expect(submitButton()).toBeDisabled();

    selectReason("HARASSMENT");
    fireEvent.change(screen.getByLabelText("Detalle (opcional)"), { target: { value: "Me insulta" } });
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(createContentReportMock).toHaveBeenCalledWith({ targetType: "FEED_POST", targetId: "p1", reason: "HARASSMENT", details: "Me insulta" })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toastMock.success).toHaveBeenCalledWith("Recibimos tu denuncia. Gracias por avisarnos.");
  });

  it("requires details when the reason is Other", async () => {
    createContentReportMock.mockResolvedValue(okResponse(false));
    renderDialog();

    selectReason("OTHER");
    fireEvent.click(submitButton());

    expect(screen.getByText("Contanos el motivo para que podamos revisarlo.")).toBeInTheDocument();
    expect(createContentReportMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Detalle"), { target: { value: "Otra cosa" } });
    fireEvent.click(submitButton());
    await waitFor(() => expect(createContentReportMock).toHaveBeenCalledTimes(1));
  });

  it("tells the user when they already reported it", async () => {
    createContentReportMock.mockResolvedValue(okResponse(true));
    const { onClose } = renderDialog();

    selectReason("SPAM");
    fireEvent.click(submitButton());

    await waitFor(() => expect(toastMock.info).toHaveBeenCalledWith("Ya lo denunciaste. Lo estamos revisando."));
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the dialog open when sending fails", async () => {
    createContentReportMock.mockRejectedValue(Object.assign(new Error("boom"), { status: 500 }));
    const { onClose } = renderDialog();

    selectReason("SPAM");
    fireEvent.click(submitButton());

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("No pudimos enviar la denuncia. Intentá de nuevo."));
    expect(onClose).not.toHaveBeenCalled();
    expect(submitButton()).toBeEnabled();
  });
});
