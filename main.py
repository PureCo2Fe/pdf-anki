import streamlit as st
import streamlit_authenticator as stauth
from app_view import AppView
from actions import Actions
import yaml
from yaml.loader import SafeLoader
import streamlit_authenticator as stauth

class Application:
    def __init__(self):
        self.actions = Actions(self)
        self.app_view = AppView(self.actions)

    def run(self):
        st.set_page_config(page_title="PDF to Anki", layout="wide", initial_sidebar_state=st.session_state.get('sidebar_state', 'expanded'))
        with open('config.YAML') as file:
            config = yaml.load(file, Loader=SafeLoader)
        authenticator = stauth.Authenticate(
            config['credentials'],
            config['cookie']['name'],
            config['cookie']['key'],
            config['cookie']['expiry_days'],
            config['preauthorized']
        )
        name, authentication_status, username = authenticator.login('Login', 'main')
        if authentication_status:
            st.success('❤ お帰りなさいませ、ご主人様！大好きだよ～！')
            self.app_view.display()
        elif authentication_status == False:
            st.error('❤ 雜魚！少來碰我！')
        elif authentication_status == None:
            st.warning('❤ 雜魚你知道密碼嘛~')

if __name__ == "__main__":
    app = Application()
    app.run()