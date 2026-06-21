import { Users, TrendingUp, Target, CheckCircle, Smartphone, Bell, Zap as Lightning, Swords, Trophy, Gamepad2, Globe, BarChart3, Coins, Shirt, Medal } from "lucide-react";

export const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    swords: Swords,
    trophy: Trophy,
    gamepad: Gamepad2,
    globe: Globe,
    chart: BarChart3,
    coins: Coins,
    shirt: Shirt,
    medal: Medal,
  };
  return iconMap[iconName] || Trophy;
};
