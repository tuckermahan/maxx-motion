declare module '../../components/ui/button' {
  export function Button(props: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
    style?: object;
  }): JSX.Element;
}

declare module '../../components/ui/card' {
  export function Card(props: {
    children: React.ReactNode;
    style?: object;
  }): JSX.Element;
}

declare module '../../components/ui/tabs' {
  export function TabBar(props: {
    children: React.ReactNode;
    style?: object;
  }): JSX.Element;
  
  export function TabItem(props: {
    label: string;
    active?: boolean;
    onPress: () => void;
  }): JSX.Element;
}

declare module '../../components/ui/list-item' {
  export function ListItem(props: {
    icon?: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
  }): JSX.Element;
} 