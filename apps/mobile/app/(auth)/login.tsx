import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function LoginScreen() {
  return (
    <View>
      <Text>Login skeleton</Text>
      <Link href="/(scan)">Go to scan</Link>
    </View>
  );
}
