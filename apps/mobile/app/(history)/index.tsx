import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function HistoryScreen() {
  return (
    <View>
      <Text>History skeleton</Text>
      <Link href="/(scan)">Scan</Link>
    </View>
  );
}
