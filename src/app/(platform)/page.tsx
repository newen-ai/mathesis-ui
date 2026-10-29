import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/routes";

export default function HomePage() {
  redirect(HOME_PATH);
}
