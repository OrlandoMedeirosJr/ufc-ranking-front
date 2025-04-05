import { redirect } from "next/navigation";

export default function Home() {
  console.log("Redirecionando para a página de ranking peso-por-peso");
  return redirect("/ranking/peso-por-peso");
}
