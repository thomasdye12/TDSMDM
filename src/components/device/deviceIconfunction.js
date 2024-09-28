import MDMIcons from '../../icons/MDMIcons.module.css' ;


export function deviceIconName (deviceModel) {
    // if the deviceModel contains MacBookPro 
    if (deviceModel?.includes("MacBook Pro")) {
        return MDMIcons["macbookpro-32"];
    }
    console.log(deviceModel);
    // AppleTV
    if (deviceModel?.includes("AppleTV")) {
        return MDMIcons["appletv-32"];
    }
    // iPhone
    if (deviceModel?.includes("iPhone")) {
        return MDMIcons["iphone-32"];
    }
  return MDMIcons["admin-icon-device-16"];
}
