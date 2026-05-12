function getRootNavigation(navigation) {
  return navigation.getParent?.()?.getParent?.() || navigation.getParent?.() || navigation;
}

export function resetToRootScreen(navigation, name, params) {
  getRootNavigation(navigation).replace(name, params);
}

export function navigateToAuth(navigation, screen = 'PhoneLogin', params) {
  const rootNavigation = getRootNavigation(navigation);

  if (screen === 'PhoneLogin') {
    rootNavigation.navigate('Auth');
    return;
  }

  rootNavigation.navigate(screen, params);
}
