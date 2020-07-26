import React, { Component } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";

import { Bar } from "./Bar";
import { Close } from "./Close";

import PropTypes from "prop-types";

let windowWidth = Dimensions.get("window").width;
let windowHeight =  Dimensions.get("window").height;

const STATUS = {
  CLOSED: 0,
  SMALL: 1,
  LARGE: 2,
};

class SwipeablePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isActive: false,
      showComponent: false,
      opacity: new Animated.Value(0),
      status: STATUS.CLOSED,
      pan: new Animated.ValueXY({ x: 0, y: windowHeight }),
      orientation: windowHeight >= windowWidth ? "portrait" : "landscape",
      panelHeight: windowHeight - (this.props.offsetTop || 0),
      panelWidth: windowWidth,
      smallPanelHeight: this.genSmallPanelHeight(this.props.smallPanelHeight),
    };

    this.pan = new Animated.ValueXY({ x: 0, y: this.state.panelHeight });
    this.isClosing = false;
    this.animatedValueY = 0;

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        this.state.pan.setOffset({
          x: 0,
          y: this.animatedValueY,
        });
        this.state.pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (
          (this.state.status === STATUS.SMALL &&
            Math.abs(this.state.pan.y._value) <= this.state.pan.y._offset) ||
          (this.state.status === STATUS.LARGE && this.state.pan.y._value > 0)
        )
          this.state.pan.setValue({
            x: 0,
            y: gestureState.dy,
          });
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { onlyLarge, onlySmall } = this.props;
        this.state.pan.flattenOffset();

        if (gestureState.dy == 0) this._animateTo(this.state.status);
        else if (gestureState.dy < -100 || gestureState.vy < -0.5) {
          if (this.state.status == STATUS.SMALL)
            this._animateTo(onlySmall ? STATUS.SMALL : STATUS.LARGE);
          else this._animateTo(STATUS.LARGE);
        } else if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          if (this.state.status == STATUS.LARGE)
            this._animateTo(onlyLarge ? STATUS.CLOSED : STATUS.SMALL);
          else this._animateTo(this.props.disabledClose ? 1 : 0);
        } else this._animateTo(this.state.status);
      },
    });
  }

  componentDidMount = () => {
    const { isActive, openLarge, onlyLarge, onlySmall } = this.props;

    this.animatedValueY = 0;
    this.state.pan.y.addListener(
      (value) => (this.animatedValueY = value.value)
    );

    this.setState({ isActive });

    if (isActive) {
      this._animateTo(
        onlySmall
          ? STATUS.SMALL
          : openLarge
          ? STATUS.LARGE
          : onlyLarge
          ? STATUS.LARGE
          : STATUS.SMALL
      );
    }

    Dimensions.addEventListener("change", () => this.getOrientation());
  };

  getOrientation = () => {
    return windowHeight >= windowWidth ? "portrait" : "landscape";
  };

  componentDidUpdate(prevProps, prevState) {
    const { isActive, openLarge, onlyLarge, onlySmall, smallPanelHeight } = this.props;
    if (onlyLarge && onlySmall)
      console.warn(
        "Ops. You are using both onlyLarge and onlySmall options. onlySmall will override the onlyLarge in this situation. Please select one of them or none."
      );
      
    if (prevProps.isActive !== isActive || prevProps.smallPanelHeight !== smallPanelHeight) {
      this.setState({ isActive: true });
      if (isActive) {
        this._animateTo(
          onlySmall
            ? STATUS.SMALL
            : openLarge
            ? STATUS.LARGE
            : onlyLarge
            ? STATUS.LARGE
            : STATUS.SMALL
        );
      } else {
        this._animateTo();
      }
    }
  }

  getKeyByValue = (object, value) => {
    return Object.keys(object).find(key => object[key] === value);
  }

  genSmallPanelHeight = (height) => {
    if (height) {
      return windowHeight - height;
    } else {
      return windowHeight - 400;
    }
  }

  _animateTo = (newStatus = 0) => {
    let newY = 0;

    if (newStatus == STATUS.CLOSED) newY = this.state.panelHeight;
    else if (newStatus == STATUS.SMALL)
      newY =
        this.state.orientation === "portrait"
          ? this.genSmallPanelHeight(this.props.smallPanelHeight)
          : this.state.panelHeight / 3;
    else if (newStatus == STATUS.LARGE) newY = 0;

    this.setState({
      showComponent: true,
      status: newStatus,
    });

    Animated.spring(this.state.pan, {
      toValue: { x: 0, y: newY },
      tension: 80,
      friction: 25,
      useNativeDriver: true,
      restDisplacementThreshold: 10,
      restSpeedThreshold: 10,
    }).start(() => {
      if (newStatus == 0) {
        this.props.onClose();
        this.setState({
          showComponent: false,
        });
      }
    });

    const status = this.getKeyByValue(STATUS,newStatus).toLowerCase();
    this.props.onChangeStatus(status)

  };

  animatedPanelHeight = () => {
    if (this.state.status === STATUS.CLOSED) {
      return 0
    } else if (this.state.status === STATUS.SMALL) {
      return this.state.smallPanelHeight
    } else if (this.state.status === STATUS.LARGE) {
      return this.state.panelHeight
    }
  }

  render() {
    const {
      showComponent,
      panelWidth,
      panelHeight,
    } = this.state;
    const {
      noBackgroundOpacity,
      style,
      closeRootStyle,
      closeIconStyle,
      barStyle,
      onClose,
      allowTouchOutside,
      closeOnTouchOutside,
    } = this.props;

    return showComponent ? (
      <Animated.View
        style={[
          SwipeablePanelStyles.background,
          {
            backgroundColor: noBackgroundOpacity
              ? "transparent"
              : "rgba(0,0,0,0.5)",
            height: allowTouchOutside ? this.animatedPanelHeight() : panelHeight,
            width: panelWidth,
          },
        ]}
      >
        {closeOnTouchOutside && (
          <TouchableWithoutFeedback onPress={() => onClose()}>
            <View
              style={[
                SwipeablePanelStyles.background,
                {
                  width: panelWidth,
                  height: allowTouchOutside ? this.animatedPanelHeight() : panelHeight,
                },
              ]}
            />
          </TouchableWithoutFeedback>
        )}
        <Animated.View
          style={[
            SwipeablePanelStyles.panel,
            this.props.shadow,
            {
              width: panelWidth,
              height: panelHeight,
            },
            { transform: this.state.pan.getTranslateTransform() },
            style,
            this.state.status === STATUS.LARGE && this.props.styleLargePanel,
          ]}
          {...this._panResponder.panHandlers}
        >
          {!this.props.noBar && <Bar barStyle={barStyle} />}
          {this.props.showCloseButton && (
            <Close
              rootStyle={closeRootStyle}
              iconStyle={closeIconStyle}
              onPress={this.props.onClose}
            />
          )}
          {this.props.children}
        </Animated.View>
      </Animated.View>
    ) : null;
  }
}

SwipeablePanel.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  showCloseButton: PropTypes.bool,
  noBackgroundOpacity: PropTypes.bool,
  style: PropTypes.object,
  closeRootStyle: PropTypes.object,
  closeIconStyle: PropTypes.object,
  closeOnTouchOutside: PropTypes.bool,
  allowTouchOutside: PropTypes.bool,
  onlyLarge: PropTypes.bool,
  onlySmall: PropTypes.bool,
  openLarge: PropTypes.bool,
  barStyle: PropTypes.object,
  noBar: PropTypes.bool,
  disabledClose: PropTypes.bool,
  offsetTop: PropTypes.number,
  smallPanelHeight: PropTypes.number,
  onChangeStatus: PropTypes.func,
  styleLargePanel: PropTypes.object,
};

SwipeablePanel.defaultProps = {
  style: {},
  onClose: () => {},
  onChangeStatus: () => {},
  closeRootStyle: {},
  closeIconStyle: {},
  openLarge: false,
  onlyLarge: false,
  onlySmall: false,
  showCloseButton: false,
  noBar: false,
  closeOnTouchOutside: false,
  allowTouchOutside: false,
  barStyle: {},
  disabledClose: false,
};

const SwipeablePanelStyles = StyleSheet.create({
  background: {
    position: "absolute",
    zIndex: 1,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  panel: {
    position: "absolute",
    height: windowHeight,
    width: windowWidth,
    transform: [{ translateY: windowHeight }],
    display: "flex",
    flexDirection: "column",
    backgroundColor: "white",
    bottom: 0,
    borderRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
    zIndex: 2,
  }
});

export default SwipeablePanel;