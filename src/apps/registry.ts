import type { MiniAppDefinition } from "./types";
import { LidIcon, AccordionIcon } from "../components/Icons";
import { LidLab } from "./lid-lab/LidLab";
import { DontWakeUp } from "./dont-wake-up/DontWakeUp";
import { Accordion } from "./accordion/Accordion";
import { MonsterIcon } from "./dont-wake-up/MonsterScene";
import { TheOtherSide, OtherSideIcon } from "./the-other-side/TheOtherSide";
import { LaptopPinball, PinballIcon } from "./laptop-pinball/LaptopPinball";
export const apps: MiniAppDefinition[] = [
  {
    id: "lid-lab",
    name: "Lid Lab",
    subtitle: "See the sensor in 3D",
    description: "Your hinge, made visible.",
    icon: LidIcon,
    component: LidLab,
    tone: "light",
  },
  {
    id: "dont-wake-up",
    name: "Don’t Wake Up",
    subtitle: "Let the little guy sleep",
    description: "A small movement. A very big reaction.",
    icon: MonsterIcon,
    component: DontWakeUp,
    tone: "red",
  },
  {
    id: "accordion",
    name: "Accordion",
    subtitle: "Play it by ear",
    description: "No lessons. Just a little showmanship.",
    icon: AccordionIcon,
    component: Accordion,
    tone: "light",
  },
  {
    id: "the-other-side",
    name: "The Other Side",
    subtitle: "Peek behind your desktop",
    description: "An ordinary desktop. An extraordinary little world.",
    icon: OtherSideIcon,
    component: TheOtherSide,
    tone: "light",
  },
  {
    id: "laptop-pinball",
    name: "Laptop Pinball",
    subtitle: "Tilt. Roll. Hole.",
    description: "A little gravity. A delicate landing.",
    icon: PinballIcon,
    component: LaptopPinball,
    tone: "light",
  },
];
