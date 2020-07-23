import React from "react";
import { StyleSheet, View } from "react-native";

export const Bar = ({ barStyle }) => {
  return (
    <View style={BarStyles.barContainer}>
      <View style={[BarStyles.bar, barStyle]} />
    </View>
  );
};

const BarStyles = StyleSheet.create({
  barContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 26,
  },
  bar: {
    width: "12%",
    height: 4,
    borderRadius: 5,
    backgroundColor: "#C6C6C8",
  },
});
