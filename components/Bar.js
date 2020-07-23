import React from "react";
import { StyleSheet, View } from "react-native";

export const Bar = ({ barStyle,barHeight }) => {
  return (
    <View style={[BarStyles.barContainer,{height: barHeight}]}>
      <View style={[BarStyles.bar, barStyle]} />
    </View>
  );
};

const BarStyles = StyleSheet.create({
  barContainer: {
    display: "flex",
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "flex-start",
  },
  bar: {
    marginTop: 8,
    width: "12%",
    height: 4,
    borderRadius: 5,
    backgroundColor: "#C6C6C8",
  },
});
