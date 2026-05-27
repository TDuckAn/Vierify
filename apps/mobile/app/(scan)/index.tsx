import { Link } from "expo-router";
import { Text, View } from "react-native";

import { getApiUrl } from "../../lib/trpc";

export default function ScanScreen() {
  return (
    <View>
      <Text>Scan skeleton</Text>
      <Text>{getApiUrl()}</Text>
      <Link href="/(history)">History</Link>
    </View>
  );
}
