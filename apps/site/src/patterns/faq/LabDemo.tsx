import { Faq } from "./Faq";
import { workshopFaq } from "./content";

export default function FaqLabDemo() {
  return <Faq id="workshop-faq" {...workshopFaq} defaultValue={["bring"]} />;
}
